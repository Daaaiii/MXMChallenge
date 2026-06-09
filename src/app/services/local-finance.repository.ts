import { Injectable } from '@angular/core';
import { FinanceGoal, FinanceState, FinanceSyncMetadata, GoalContribution, LegacyFinanceEntry } from '../models/finance';
import { BrowserStorageService } from './browser-storage.service';
import { FinanceRepository } from './finance.repository';
import { Observable, of } from 'rxjs';

const DEFAULT_STATE: FinanceState = {
  incomes: [],
  expenses: [],
  cards: [],
  goals: [],
  accounts: [],
  investments: [],
};

@Injectable({
  providedIn: 'root',
})
export class LocalFinanceRepository implements FinanceRepository {
  constructor(private storage: BrowserStorageService) {}

  load(userKey: string): Observable<FinanceState> {
    const rawState = this.storage.getItem(userKey);
    if (!rawState) {
      return of(DEFAULT_STATE);
    }

    try {
      return of(normalizeState(JSON.parse(rawState)));
    } catch {
      return of(DEFAULT_STATE);
    }
  }

  save(userKey: string, state: FinanceState): Observable<FinanceState> {
    this.storage.setItem(userKey, JSON.stringify(state));
    return of(state);
  }
}

export function normalizeFinanceState(value: Partial<FinanceState> & { entries?: LegacyFinanceEntry[] }): FinanceState {
  return normalizeState(value);
}

function normalizeState(value: Partial<FinanceState> & { entries?: LegacyFinanceEntry[] }): FinanceState {
  if (Array.isArray(value.entries) && !Array.isArray(value.expenses)) {
    return {
      incomes: [],
      expenses: value.entries.map((entry) => ({
        id: entry.id,
        description: entry.description,
        category: entry.category,
        amount: entry.amount,
        date: entry.date,
        paymentMethod: entry.type === 'card-purchase' ? 'credit-card' : 'cash',
        accountId: entry.accountId,
        cardId: entry.cardId,
        installments: entry.installments || 1,
        ...normalizeMetadata({}, entry.date),
      })),
      cards: (value.cards || []).map((card) => normalizeEntity(card)),
      goals: normalizeGoals(value.goals || []),
      accounts: (value.accounts || []).map((account) => normalizeEntity(account)),
      investments: (value.investments || []).map((investment) => normalizeEntity(investment, investment.startDate)),
    };
  }

  return {
    incomes: (value.incomes || []).map((income) => normalizeEntity(income, income.date)),
    expenses: (value.expenses || []).map((expense) => normalizeEntity(expense, expense.date)),
    cards: (value.cards || []).map((card) => normalizeEntity(card)),
    goals: normalizeGoals(value.goals || []),
    accounts: (value.accounts || []).map((account) => normalizeEntity(account)),
    investments: (value.investments || []).map((investment) => normalizeEntity(investment, investment.startDate)),
  };
}

function normalizeGoals(goals: Array<Partial<FinanceGoal> & { id: string; name: string; deadline: string }>): FinanceGoal[] {
  return goals.map((goal) => {
    const contributions = goal.contributions || [];
    const currentAmount = contributions.length ? getGoalCurrentAmount(contributions) : Number(goal.currentAmount || 0);
    return normalizeEntity({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.targetAmount || 0),
      currentAmount,
      deadline: goal.deadline,
      accountId: goal.accountId,
      contributions: contributions.map((contribution) => normalizeEntity(contribution, contribution.date)),
      completed: goal.completed ?? currentAmount >= Number(goal.targetAmount || 0),
    } as FinanceGoal, goal.deadline);
  });
}

function getGoalCurrentAmount(contributions: GoalContribution[]): number {
  return contributions.reduce((total, contribution) => total + Number(contribution.amount || 0), 0);
}

function normalizeEntity<T extends object>(entity: T, fallbackDate?: string): T & FinanceSyncMetadata {
  return {
    ...entity,
    ...normalizeMetadata(entity, fallbackDate),
  };
}

function normalizeMetadata(metadata: Partial<FinanceSyncMetadata>, fallbackDate?: string): Required<Pick<FinanceSyncMetadata, 'createdAt' | 'updatedAt' | 'version'>> &
  Pick<FinanceSyncMetadata, 'deletedAt'> {
  const timestamp = toTimestamp(fallbackDate);

  return {
    createdAt: metadata.createdAt || timestamp,
    updatedAt: metadata.updatedAt || metadata.createdAt || timestamp,
    deletedAt: metadata.deletedAt,
    version: Number(metadata.version || 1),
  };
}

function toTimestamp(date?: string): string {
  if (date) {
    return date.length === 10 ? `${date}T00:00:00.000Z` : date;
  }

  return new Date().toISOString();
}
