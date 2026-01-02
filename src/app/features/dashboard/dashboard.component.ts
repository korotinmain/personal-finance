import { Component } from "@angular/core";
import {
  AsyncPipe,
  NgForOf,
  NgIf,
  NgFor,
  DecimalPipe,
  SlicePipe,
  CommonModule,
} from "@angular/common";
import { DataService } from "../../core/services/data.service";
import { map } from "rxjs";
import { Wallet } from "../../models/wallet.model";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    NgForOf,
    NgIf,
    NgFor,
    DecimalPipe,
    SlicePipe,
  ],
  template: `
    <section class="dashboard-hero card glass">
      <div class="hero-summary">
        <div class="hero-row">
          <div class="hero-total">
            <span class="currency-pill">₴</span>
            <p class="eyebrow">На рахунку</p>
            <h1>{{ (totals$ | async)?.UAH | number : "1.0-0" }}</h1>
            <p class="muted">Останнє оновлення: зараз</p>
          </div>
          <div class="hero-actions">
            <button class="primary pill-btn">+ Додати витрату</button>
            <button class="ghost pill-btn">+ Борг</button>
            <button class="ghost pill-btn">+ Ціль</button>
            <button class="circle ghost sm">⋯</button>
          </div>
        </div>
        <div class="hero-balances compact">
          <div class="hero-balance tile">
            <div class="tile-label">UAH</div>
            <strong>{{ (totals$ | async)?.UAH | number : "1.0-0" }}</strong>
          </div>
          <div class="hero-balance tile">
            <div class="tile-label">USD</div>
            <strong>{{ (totals$ | async)?.USD | number : "1.0-0" }}</strong>
          </div>
          <div class="hero-balance tile">
            <div class="tile-label">EUR</div>
            <strong>{{ (totals$ | async)?.EUR | number : "1.0-0" }}</strong>
          </div>
        </div>
      </div>
      <div class="hero-illustration">
        <div class="hero-clouds"></div>
        <div class="hero-card-stack">
          <div class="stack-card one"></div>
          <div class="stack-card two"></div>
          <div class="stack-card three"></div>
        </div>
      </div>
    </section>

    <div class="dashboard-grid">
      <div class="card panel">
        <div class="card-head spaced">
          <div>
            <p class="eyebrow">Витрати у травні</p>
            <h3>Динаміка</h3>
          </div>
          <div class="chips">
            <span>Курс</span>
            <span>Бюджет</span>
            <span>Доходи</span>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="ring"></div>
          <div class="line"></div>
        </div>
      </div>

      <div class="card soft">
        <div class="card-head spaced">
          <div>
            <p class="eyebrow">Активні борги</p>
            <h3>Стан</h3>
          </div>
          <button class="ghost sm">⋯</button>
        </div>
        <div class="debt-list">
          <div class="debt-row" *ngFor="let debt of debts$ | async">
            <div class="avatar tiny">{{ debt.title[0] }}</div>
            <div class="debt-info">
              <strong>{{ debt.title }}</strong>
              <small>{{ debt.createdAt | date : "dd.MM.yyyy" }}</small>
            </div>
            <div
              class="debt-amount"
              [class.positive]="debt.direction === 'owedToMe'"
            >
              {{ debt.direction === "owedToMe" ? "+" : "-"
              }}{{ debt.totalAmount | number : "1.0-0" }} {{ debt.currency }}
            </div>
          </div>
        </div>
        <button class="ghost full pill-btn">+ Додати борг</button>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-head spaced">
        <h3>Останні транзакції</h3>
        <div class="chips">
          <span>Всі типи</span>
          <span>Всі валюти</span>
        </div>
      </div>
      <div class="transaction-list">
        <div
          class="tx-row"
          *ngFor="let tx of transactions$ | async | slice : 0 : 5"
        >
          <div class="tx-main">
            <div class="avatar tiny">{{ tx.owner === "me" ? "Я" : "Д" }}</div>
            <div>
              <strong>{{ tx.note || tx.type }}</strong>
              <small>{{ tx.createdAt | date : "dd MMM" }}</small>
            </div>
          </div>
          <div class="tx-meta">
            <span class="pill small">{{ tx.walletId }}</span>
            <span class="pill small">{{ tx.type }}</span>
          </div>
          <div class="tx-amount" [class.positive]="tx.type !== 'expense'">
            {{ tx.type === "expense" ? "-" : "+"
            }}{{ tx.amount | number : "1.0-0" }} {{ tx.currency }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  wallets$ = this.data.wallets$();
  walletCurrencies = ["UAH", "USD", "EUR"] as const;
  totals$ = this.wallets$.pipe(map((wallets) => this.aggregateTotals(wallets)));
  debts$ = this.data.debts$();
  transactions$ = this.data.transactions$();

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
}
