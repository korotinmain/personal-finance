import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

const configuredWhitelist = functions.config().access?.whitelist as string | undefined;
const allowedEmails = (configuredWhitelist ? configuredWhitelist.split(',') : ['korotinmain@gmail.com'])
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function requireWhitelisted(context: functions.https.CallableContext): void {
  const email = context.auth?.token?.email?.toLowerCase();
  if (!email || !allowedEmails.includes(email)) {
    throw new functions.https.HttpsError('permission-denied', 'Access denied');
  }
}

type Currency = 'UAH' | 'USD' | 'EUR';
type TransactionType = 'expense' | 'income' | 'transfer';

type TransactionPayload = {
  type: TransactionType;
  owner: 'me' | 'wife';
  walletId: string;
  targetWalletId?: string;
  amount: number;
  currency: Currency;
  category?: string;
  note?: string;
  createdAt: number;
};

function balanceUpdate(currency: Currency, amount: number): Record<string, admin.firestore.FieldValue> {
  return { [`balances.${currency}`]: admin.firestore.FieldValue.increment(amount) };
}

function assertValid(condition: boolean, message: string): void {
  if (!condition) {
    throw new functions.https.HttpsError('invalid-argument', message);
  }
}

function parseTransactionPayload(data: any, options: { requireId: boolean }): TransactionPayload & { id?: string } {
  const type = data?.type as TransactionType;
  const owner = data?.owner as 'me' | 'wife';
  const walletId = String(data?.walletId ?? '').trim();
  const targetWalletId = String(data?.targetWalletId ?? '').trim();
  const amount = Number(data?.amount);
  const currency = data?.currency as Currency;
  const category = typeof data?.category === 'string' ? data.category : undefined;
  const note = typeof data?.note === 'string' ? data.note : undefined;

  assertValid(['expense', 'income', 'transfer'].includes(type), 'Invalid transaction type');
  assertValid(['me', 'wife'].includes(owner), 'Invalid owner');
  assertValid(Boolean(walletId), 'walletId is required');
  assertValid(Number.isFinite(amount) && amount > 0, 'amount must be positive');
  assertValid(['UAH', 'USD', 'EUR'].includes(currency), 'Invalid currency');

  if (type === 'transfer') {
    assertValid(Boolean(targetWalletId), 'targetWalletId is required for transfer');
    assertValid(targetWalletId !== walletId, 'targetWalletId must differ from walletId');
  }

  if (options.requireId) {
    const id = String(data?.id ?? '').trim();
    assertValid(Boolean(id), 'id is required');
    return {
      id,
      type,
      owner,
      walletId,
      targetWalletId: targetWalletId || undefined,
      amount,
      currency,
      category,
      note,
      createdAt: Number(data?.createdAt ?? Date.now())
    };
  }

  return {
    type,
    owner,
    walletId,
    targetWalletId: targetWalletId || undefined,
    amount,
    currency,
    category,
    note,
    createdAt: Date.now()
  };
}

export const createTransaction = functions.https.onCall(async (data: TransactionPayload, context) => {
  requireWhitelisted(context);

  const payload = parseTransactionPayload(data, { requireId: false });
  const transactionRef = db.collection('transactions').doc();
  const walletRef = db.doc(`wallets/${payload.walletId}`);
  const targetRef = payload.targetWalletId ? db.doc(`wallets/${payload.targetWalletId}`) : null;

  await db.runTransaction(async (tx) => {
    tx.set(transactionRef, payload);

    if (payload.type === 'expense') {
      tx.update(walletRef, balanceUpdate(payload.currency, -payload.amount));
    } else if (payload.type === 'income') {
      tx.update(walletRef, balanceUpdate(payload.currency, payload.amount));
    } else if (payload.type === 'transfer' && targetRef) {
      tx.update(walletRef, balanceUpdate(payload.currency, -payload.amount));
      tx.update(targetRef, balanceUpdate(payload.currency, payload.amount));
    }
  });

  return { id: transactionRef.id };
});

export const updateTransaction = functions.https.onCall(async (data: TransactionPayload & { id: string }, context) => {
  requireWhitelisted(context);

  const payload = parseTransactionPayload(data, { requireId: true });
  const transactionRef = db.doc(`transactions/${payload.id}`);

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(transactionRef);
    if (!snapshot.exists) {
      throw new functions.https.HttpsError('not-found', 'Transaction not found');
    }

    const prev = snapshot.data() as TransactionPayload;

    const prevWalletRef = db.doc(`wallets/${prev.walletId}`);
    const prevTargetRef = prev.targetWalletId ? db.doc(`wallets/${prev.targetWalletId}`) : null;

    if (prev.type === 'expense') {
      tx.update(prevWalletRef, balanceUpdate(prev.currency, prev.amount));
    } else if (prev.type === 'income') {
      tx.update(prevWalletRef, balanceUpdate(prev.currency, -prev.amount));
    } else if (prev.type === 'transfer' && prevTargetRef) {
      tx.update(prevWalletRef, balanceUpdate(prev.currency, prev.amount));
      tx.update(prevTargetRef, balanceUpdate(prev.currency, -prev.amount));
    }

    const nextWalletRef = db.doc(`wallets/${payload.walletId}`);
    const nextTargetRef = payload.targetWalletId ? db.doc(`wallets/${payload.targetWalletId}`) : null;

    if (payload.type === 'expense') {
      tx.update(nextWalletRef, balanceUpdate(payload.currency, -payload.amount));
    } else if (payload.type === 'income') {
      tx.update(nextWalletRef, balanceUpdate(payload.currency, payload.amount));
    } else if (payload.type === 'transfer' && nextTargetRef) {
      tx.update(nextWalletRef, balanceUpdate(payload.currency, -payload.amount));
      tx.update(nextTargetRef, balanceUpdate(payload.currency, payload.amount));
    }

    tx.update(transactionRef, { ...payload, createdAt: prev.createdAt });
  });

  return { id: payload.id };
});

export const deleteTransaction = functions.https.onCall(async (data: { id: string }, context) => {
  requireWhitelisted(context);

  const id = String(data?.id ?? '').trim();
  assertValid(Boolean(id), 'id is required');
  const transactionRef = db.doc(`transactions/${id}`);

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(transactionRef);
    if (!snapshot.exists) {
      throw new functions.https.HttpsError('not-found', 'Transaction not found');
    }

    const prev = snapshot.data() as TransactionPayload;
    const walletRef = db.doc(`wallets/${prev.walletId}`);
    const targetRef = prev.targetWalletId ? db.doc(`wallets/${prev.targetWalletId}`) : null;

    if (prev.type === 'expense') {
      tx.update(walletRef, balanceUpdate(prev.currency, prev.amount));
    } else if (prev.type === 'income') {
      tx.update(walletRef, balanceUpdate(prev.currency, -prev.amount));
    } else if (prev.type === 'transfer' && targetRef) {
      tx.update(walletRef, balanceUpdate(prev.currency, prev.amount));
      tx.update(targetRef, balanceUpdate(prev.currency, -prev.amount));
    }

    tx.delete(transactionRef);
  });

  return { id };
});

export const addDebtPayment = functions.https.onCall(
  async (data: { debtId: string; amount: number; paidAt: number; note?: string }, context) => {
    requireWhitelisted(context);

    const debtId = String(data?.debtId ?? '').trim();
    const amount = Number(data?.amount);
    assertValid(Boolean(debtId), 'debtId is required');
    assertValid(Number.isFinite(amount) && amount > 0, 'amount must be positive');

    const debtRef = db.doc(`debts/${debtId}`);
    const paymentRef = db.collection(`debts/${debtId}/payments`).doc();

    await db.runTransaction(async (tx) => {
      const debtSnap = await tx.get(debtRef);
      if (!debtSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Debt not found');
      }
      const debt = debtSnap.data() as { totalAmount: number; paidAmount: number };
      const nextPaid = debt.paidAmount + amount;
      const nextStatus = nextPaid >= debt.totalAmount ? 'paid' : 'active';

      tx.set(paymentRef, { debtId, amount, paidAt: Date.now(), note: data?.note, createdAt: Date.now() });
      tx.update(debtRef, { paidAmount: nextPaid, status: nextStatus });
    });

    return { id: paymentRef.id };
  }
);

export const adjustGoal = functions.https.onCall(
  async (data: { goalId: string; delta: number }, context) => {
    requireWhitelisted(context);

    const goalId = String(data?.goalId ?? '').trim();
    const delta = Number(data?.delta);
    assertValid(Boolean(goalId), 'goalId is required');
    assertValid(Number.isFinite(delta) && delta !== 0, 'delta must be non-zero');

    const goalRef = db.doc(`goals/${goalId}`);

    await db.runTransaction(async (tx) => {
      const goalSnap = await tx.get(goalRef);
      if (!goalSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Goal not found');
      }
      const goal = goalSnap.data() as { targetAmount: number; currentAmount: number };
      const nextCurrent = goal.currentAmount + delta;
      assertValid(nextCurrent >= 0, 'currentAmount cannot be negative');
      const nextStatus = nextCurrent >= goal.targetAmount ? 'completed' : 'active';

      tx.update(goalRef, { currentAmount: nextCurrent, status: nextStatus });
    });

    return { id: goalId };
  }
);
