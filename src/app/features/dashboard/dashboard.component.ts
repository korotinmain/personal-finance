import { Component } from "@angular/core";
import {
  AsyncPipe,
  NgForOf,
  NgIf,
  DecimalPipe,
  CommonModule,
} from "@angular/common";
import { RouterLink } from "@angular/router";
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { DataService } from "../../core/services/data.service";
import { map } from "rxjs";
import { curveBasis } from "d3-shape";
import { Currency, Wallet, WalletType } from "../../models/wallet.model";
import { Transaction } from "../../models/transaction.model";
import { Color } from "@swimlane/ngx-charts";
import { LucideIconsModule } from "../../shared/lucide-icons.module";

type WalletSummary = {
  name: string;
  typeLabel: string;
  display: string;
};

type SpendingSnapshot = {
  breakdown: { name: string; value: number }[];
  spent: number;
  goal: number;
  percent: number;
};

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    NgForOf,
    NgIf,
    DecimalPipe,
    NgxChartsModule,
    RouterLink,
    LucideIconsModule,
  ],
  template: `
    <section class="board">
      <div class="card hero-card glass">
        <div class="hero-header">
          <div>
            <p class="eyebrow">Загальний баланс</p>
            <div class="value-line" *ngIf="totals$ | async as totals">
              <h1>
                {{ totals.UAH | number : "1.0-0" }}
                <span class="unit">UAH</span>
              </h1>
              <span class="pill success">
                <lucide-icon name="TrendingUp" size="16"></lucide-icon>
                +2.5% 24г
              </span>
            </div>
            <p class="muted">
              Гривневий баланс • USD/EUR показані окремо без конвертації
            </p>
          </div>
          <div class="hero-actions">
            <button class="action-pill primary">
              <lucide-icon name="Send" size="18"></lucide-icon>
              Переказ
            </button>
            <button class="action-pill ghosty">
              <lucide-icon name="CreditCard" size="18"></lucide-icon>
              Оплатити
            </button>
            <button class="action-pill ghosty">
              <lucide-icon name="ArrowUpRight" size="18"></lucide-icon>
              Запит
            </button>
            <button class="action-pill ghosty">
              <lucide-icon name="Download" size="18"></lucide-icon>
              Депозит
            </button>
          </div>
        </div>
        <div class="chart-wrapper">
          <ngx-charts-line-chart
            [results]="chartData"
            [scheme]="colorScheme"
            [xAxis]="false"
            [yAxis]="false"
            [legend]="false"
            [autoScale]="true"
            [timeline]="false"
            [animations]="true"
            [curve]="curve"
            [gradient]="true"
          >
          </ngx-charts-line-chart>
        </div>
        <div class="mini-stats" *ngIf="totals$ | async as totals">
          <div class="mini-stat">
            <p>UAH</p>
            <strong>{{ totals.UAH | number : "1.0-0" }}</strong>
          </div>
          <div class="mini-stat">
            <p>USD</p>
            <strong>{{ totals.USD | number : "1.0-0" }}</strong>
          </div>
          <div class="mini-stat">
            <p>EUR</p>
            <strong>{{ totals.EUR | number : "1.0-0" }}</strong>
          </div>
          <div class="mini-stat">
            <p>Транзакцій</p>
            <strong>{{ (transactions$ | async)?.length || 0 }}</strong>
          </div>
        </div>
      </div>

      <div class="card side-card glass">
        <div class="card-head spaced">
          <div>
            <p class="eyebrow">Рахунки</p>
            <h3>Огляд</h3>
          </div>
          <span class="pill subtle">{{ (wallets$ | async)?.length || 0 }}</span>
        </div>
        <div class="accounts-list">
          <div class="account-row" *ngFor="let wallet of walletSummaries$ | async">
            <div class="avatar tiny">{{ wallet.name[0] }}</div>
            <div class="account-meta">
              <strong>{{ wallet.name }}</strong>
              <small>{{ wallet.typeLabel }}</small>
            </div>
            <div class="account-balance">{{ wallet.display }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="board lower">
      <div class="card table-card glass">
        <div class="card-head spaced">
          <h3>Останні транзакції</h3>
          <a routerLink="/app/transactions" class="muted link">Дивитись усі</a>
        </div>
        <div class="transaction-list rich">
          <div class="tx-row rich" *ngFor="let tx of recentTransactions$ | async">
            <div class="tx-main">
              <div class="tx-icon" [class.expense]="tx.type === 'expense'">
                <lucide-icon
                  [name]="tx.type === 'expense' ? 'ArrowDownRight' : 'ArrowUpRight'"
                  size="16"
                ></lucide-icon>
              </div>
              <div>
                <strong>{{ tx.note || tx.type }}</strong>
                <small>{{ tx.createdAt | date : "dd MMM, HH:mm" }}</small>
              </div>
            </div>
            <div class="tx-meta">
              <span class="pill small">{{ tx.walletId }}</span>
              <span class="pill small ghosty">{{
                tx.type === "expense" ? "Витрата" : "Надходження"
              }}</span>
            </div>
            <div class="tx-amount" [class.positive]="tx.type !== 'expense'">
              {{ tx.type === "expense" ? "-" : "+"
              }}{{ tx.amount | number : "1.0-0" }} {{ tx.currency }}
            </div>
          </div>
        </div>
      </div>

      <div class="card spending-card glass" *ngIf="spending$ | async as spending">
        <div class="card-head spaced">
          <div>
            <p class="eyebrow">Місячні витрати</p>
            <h3>Контроль бюджету</h3>
          </div>
          <span class="pill subtle">{{ spending.percent }}% ліміту</span>
        </div>
        <div class="spending-body">
          <div class="donut">
            <ngx-charts-pie-chart
              [results]="spending.breakdown"
              [scheme]="pieScheme"
              [legend]="false"
              [doughnut]="true"
              [labels]="false"
              [arcWidth]="0.24"
              [animations]="true"
              [gradient]="true"
            >
            </ngx-charts-pie-chart>
          </div>
          <div class="spending-progress">
            <p>Витрачено {{ spending.spent | number : "1.0-0" }} ₴</p>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="spending.percent"></div>
            </div>
            <div class="progress-meta">
              <span>Бюджет {{ spending.goal | number : "1.0-0" }} ₴</span>
              <span
                >Залишок
                {{ (spending.goal - spending.spent) | number : "1.0-0" }} ₴</span
              >
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class DashboardComponent {
  wallets$ = this.data.wallets$();
  walletSummaries$ = this.wallets$.pipe(
    map((wallets) => wallets.map((wallet) => this.toWalletSummary(wallet)))
  );
  totals$ = this.wallets$.pipe(map((wallets) => this.aggregateTotals(wallets)));
  transactions$ = this.data.transactions$();
  recentTransactions$ = this.transactions$.pipe(
    map((txs) => txs.slice(0, 6))
  );
  spending$ = this.transactions$.pipe(
    map((txs) => this.buildSpendingSnapshot(txs))
  );
  chartData = [
    {
      name: "Баланс",
      series: [
        { name: "Пн", value: 16400 },
        { name: "Вт", value: 16850 },
        { name: "Ср", value: 16120 },
        { name: "Чт", value: 17320 },
        { name: "Пт", value: 18200 },
        { name: "Сб", value: 18700 },
        { name: "Нд", value: 19150 },
      ],
    },
  ];
  colorScheme = {
    domain: ["#7be8c8", "#7dd3fc"],
  };
  curve = curveBasis;
  pieScheme: Partial<Color> = {
    domain: ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#f472b6"],
  };

  constructor(private data: DataService) {}

  private aggregateTotals(
    wallets: Wallet[]
  ): Record<"UAH" | "USD" | "EUR", number> {
    const base = { UAH: 0, USD: 0, EUR: 0 } as Record<
      "UAH" | "USD" | "EUR",
      number
    >;
    return wallets.reduce((acc, w) => {
      acc.UAH += w.balances.UAH ?? 0;
      acc.USD += w.balances.USD ?? 0;
      acc.EUR += w.balances.EUR ?? 0;
      return acc;
    }, base);
  }

  private toWalletSummary(wallet: Wallet): WalletSummary {
    return {
      name: wallet.name,
      typeLabel: this.describeWalletType(wallet.type),
      display: this.formatWalletBalance(wallet),
    };
  }

  private describeWalletType(type: WalletType): string {
    switch (type) {
      case "cash":
        return "Готівка";
      case "fop":
        return "ФОП";
      default:
        return "Карта";
    }
  }

  private formatWalletBalance(wallet: Wallet): string {
    const currencies: Currency[] = ["UAH", "USD", "EUR"];
    const balances = currencies
      .filter((currency) => (wallet.balances[currency] ?? 0) > 0)
      .map((currency) => `${this.formatNumber(wallet.balances[currency])} ${currency}`);

    return balances[0] ?? "0";
  }

  private formatNumber(value?: number): string {
    return new Intl.NumberFormat("uk-UA", {
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  private buildSpendingSnapshot(transactions: Transaction[]): SpendingSnapshot {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const expenses = transactions.filter(
      (tx) => tx.type === "expense" && tx.createdAt >= monthStart
    );

    const totals = new Map<string, number>();
    for (const tx of expenses) {
      const key = tx.category || "Інше";
      totals.set(key, (totals.get(key) ?? 0) + Math.abs(tx.amount));
    }

    const breakdown = Array.from(totals.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    if (!breakdown.length) {
      breakdown.push({ name: "Без витрат", value: 1 });
    }

    const spent = expenses.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );
    const goal = 8000;
    const percent = Math.min(100, Math.round((spent / goal) * 100));

    return { breakdown, spent, goal, percent };
  }
}
