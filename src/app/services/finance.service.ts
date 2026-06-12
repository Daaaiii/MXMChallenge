import { Injectable } from '@angular/core';
import { Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  CreditCard,
  Expense,
  AccountBalanceSummary,
  BankAccount,
  FinanceDeleteResult,
  FinanceGoal,
  FinanceLaunch,
  FinanceState,
  FinanceSyncMetadata,
  GoalContribution,
  Income,
  Investment,
  InvestmentGroup,
  InvestmentRedemptionRequest,
  InvestmentSummary,
  MonthlyBalance,
  MonthlyInstallment,
  MonthlySummary,
  NetWorthSummary,
} from '../models/finance';
import { AuthService } from './auth.service';
import { FinanceRepository } from './finance.repository';
import { FINANCE_REPOSITORY } from './finance-repository.token';

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
export class FinanceService {
  private readonly stateSubject = new BehaviorSubject<FinanceState>(DEFAULT_STATE);
  readonly state$ = this.stateSubject.asObservable();

  constructor(
    @Inject(FINANCE_REPOSITORY) private financeRepository: FinanceRepository,
    private authService: AuthService
  ) {
    this.loadState();
  }

  getState(): FinanceState {
    return this.stateSubject.getValue();
  }

  addIncome(income: Omit<Income, 'id'>): void {
    const state = this.getState();
    this.saveState({ ...state, incomes: [createTrackedEntity(income), ...state.incomes] });
  }

  updateIncome(incomeId: string, income: Omit<Income, 'id'>): void {
    const state = this.getState();
    this.saveState({
      ...state,
      incomes: state.incomes.map((item) => (item.id === incomeId ? updateTrackedEntity(item, income) : item)),
    });
  }

  deleteIncome(incomeId: string): FinanceDeleteResult {
    const state = this.getState();
    this.saveState({
      ...state,
      incomes: state.incomes.filter((income) => income.id !== incomeId),
    });
    return successResult('Entrada excluida.');
  }

  addAccount(account: Omit<BankAccount, 'id'>): void {
    const state = this.getState();
    this.saveState({ ...state, accounts: [createTrackedEntity(account), ...state.accounts] });
  }

  updateAccount(accountId: string, account: Omit<BankAccount, 'id'>): void {
    const state = this.getState();
    this.saveState({
      ...state,
      accounts: state.accounts.map((item) => (item.id === accountId ? updateTrackedEntity(item, account) : item)),
    });
  }

  deleteAccount(accountId: string): FinanceDeleteResult {
    const state = this.getState();
    const isUsed =
      state.incomes.some((income) => income.accountId === accountId) ||
      state.expenses.some((expense) => expense.accountId === accountId) ||
      state.goals.some((goal) => goal.accountId === accountId) ||
      state.goals.some((goal) => goal.contributions.some((contribution) => contribution.accountId === accountId)) ||
      state.investments.some((investment) => investment.accountId === accountId);

    if (isUsed) {
      return blockedResult('Conta vinculada a entradas, despesas, metas ou investimentos. Remova os vinculos antes de excluir.');
    }

    this.saveState({
      ...state,
      accounts: state.accounts.filter((account) => account.id !== accountId),
    });
    return successResult('Conta excluida.');
  }

  addInvestment(investment: Omit<Investment, 'id'>): void {
    const state = this.getState();
    this.saveState({ ...state, investments: [createTrackedEntity(investment), ...state.investments] });
  }

  updateInvestment(investmentId: string, investment: Omit<Investment, 'id'>): void {
    const state = this.getState();
    this.saveState({
      ...state,
      investments: state.investments.map((item) =>
        item.id === investmentId ? updateTrackedEntity(item, investment) : item
      ),
    });
  }

  deleteInvestment(investmentId: string): FinanceDeleteResult {
    const state = this.getState();
    this.saveState({
      ...state,
      investments: state.investments.filter((investment) => investment.id !== investmentId),
    });
    return successResult('Investimento excluido.');
  }

  redeemInvestment(redemption: InvestmentRedemptionRequest): FinanceDeleteResult {
    const state = this.getState();
    const investment = state.investments.find((item) => item.id === redemption.investmentId);
    const destinationAccount = state.accounts.find((account) => account.id === redemption.accountId);
    const amount = Number(redemption.amount || 0);

    if (!investment) {
      return blockedResult('Investimento nao encontrado.');
    }

    if (!destinationAccount) {
      return blockedResult('Conta de destino nao encontrada.');
    }

    if (amount <= 0) {
      return blockedResult('Informe um valor de resgate valido.');
    }

    if (amount > Number(investment.currentAmount || 0)) {
      return blockedResult('Valor de resgate maior que o valor atual do investimento.');
    }

    const currentAmount = Number(investment.currentAmount || 0);
    const investedAmount = Number(investment.investedAmount || 0);
    const remainingCurrent = currentAmount - amount;
    const redemptionRatio = currentAmount > 0 ? amount / currentAmount : 0;
    const redeemedInvestedAmount = investedAmount * redemptionRatio;
    const remainingInvested = Math.max(investedAmount - redeemedInvestedAmount, 0);
    const date = redemption.date || new Date().toISOString().slice(0, 10);
    const description = `Resgate - ${investment.name}`;
    const notes = redemption.notes || undefined;
    const shouldTransferBetweenAccounts = !!investment.accountId && investment.accountId !== redemption.accountId;
    const income: Income = createTrackedEntity({
      description,
      category: 'Outros',
      amount,
      date,
      recurring: false,
      active: true,
      accountId: redemption.accountId,
    });
    const transferExpense: Expense | undefined = shouldTransferBetweenAccounts
      ? createTrackedEntity({
          description: `Transferencia de resgate - ${investment.name}`,
          category: 'Outros' as const,
          amount,
          date,
          paymentMethod: 'pix' as const,
          accountId: investment.accountId,
          installments: 1,
          notes,
        })
      : undefined;

    this.saveState({
      ...state,
      incomes: shouldTransferBetweenAccounts || !investment.accountId ? [income, ...state.incomes] : state.incomes,
      expenses: transferExpense ? [transferExpense, ...state.expenses] : state.expenses,
      investments:
        remainingCurrent <= 0
          ? state.investments.filter((item) => item.id !== investment.id)
          : state.investments.map((item) =>
              item.id === investment.id
                ? updateTrackedEntity(item, {
                    currentAmount: remainingCurrent,
                    investedAmount: remainingInvested,
                    notes: appendInvestmentNote(item.notes, `Resgate de ${toCurrency(amount)} em ${date}${notes ? ` - ${notes}` : ''}`),
                  })
                : item
            ),
    });

    return successResult(remainingCurrent <= 0 ? 'Investimento resgatado integralmente.' : 'Resgate registrado.');
  }

  addExpense(expense: Omit<Expense, 'id'>): void {
    const state = this.getState();
    this.saveState({ ...state, expenses: [createTrackedEntity(expense), ...state.expenses] });
  }

  updateExpense(expenseId: string, expense: Omit<Expense, 'id'>): void {
    const state = this.getState();
    this.saveState({
      ...state,
      expenses: state.expenses.map((item) => (item.id === expenseId ? updateTrackedEntity(item, expense) : item)),
    });
  }

  deleteExpense(expenseId: string): FinanceDeleteResult {
    const state = this.getState();
    this.saveState({
      ...state,
      expenses: state.expenses.filter((expense) => expense.id !== expenseId),
    });
    return successResult('Despesa excluida.');
  }

  addCard(card: Omit<CreditCard, 'id'>): void {
    const state = this.getState();
    this.saveState({ ...state, cards: [createTrackedEntity(card), ...state.cards] });
  }

  updateCard(cardId: string, card: Omit<CreditCard, 'id'>): void {
    const state = this.getState();
    this.saveState({
      ...state,
      cards: state.cards.map((item) => (item.id === cardId ? updateTrackedEntity(item, card) : item)),
    });
  }

  deleteCard(cardId: string): FinanceDeleteResult {
    const state = this.getState();
    const isUsed = state.expenses.some((expense) => expense.cardId === cardId);

    if (isUsed) {
      return blockedResult('Cartao vinculado a compras. Remova ou edite as compras antes de excluir.');
    }

    this.saveState({
      ...state,
      cards: state.cards.filter((card) => card.id !== cardId),
    });
    return successResult('Cartao excluido.');
  }

  addGoal(goal: Omit<FinanceGoal, 'id' | 'contributions' | 'completed'>): void {
    const currentAmount = Number(goal.currentAmount || 0);
    const targetAmount = Number(goal.targetAmount || 0);
    const initialContribution: GoalContribution[] =
      currentAmount > 0 ? [createTrackedEntity({ amount: currentAmount, date: new Date().toISOString().slice(0, 10) })] : [];
    const state = this.getState();

    this.saveState({
      ...state,
      goals: [
        createTrackedEntity({
          ...goal,
          currentAmount,
          targetAmount,
          contributions: initialContribution,
          completed: currentAmount >= targetAmount,
        }),
        ...state.goals,
      ],
    });
  }

  updateGoal(goalId: string, goal: Omit<FinanceGoal, 'id' | 'currentAmount' | 'completed'>): void {
    const state = this.getState();
    this.saveState({
      ...state,
      goals: state.goals.map((item) => {
        if (item.id !== goalId) {
          return item;
        }

        const currentAmount = getGoalCurrentAmount(goal.contributions);
        return {
          ...updateTrackedEntity(item, goal),
          currentAmount,
          completed: currentAmount >= goal.targetAmount,
        };
      }),
    });
  }

  deleteGoal(goalId: string): FinanceDeleteResult {
    const state = this.getState();
    const goal = state.goals.find((item) => item.id === goalId);

    if (goal?.contributions.length) {
      return blockedResult('Meta com contribuicoes. Exclua as contribuicoes antes de excluir a meta.');
    }

    this.saveState({
      ...state,
      goals: state.goals.filter((item) => item.id !== goalId),
    });
    return successResult('Meta excluida.');
  }

  addGoalContribution(goalId: string, contribution: Omit<GoalContribution, 'id'>): void {
    const state = this.getState();
    this.saveState({
      ...state,
      goals: state.goals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }

        const contributions = [createTrackedEntity(contribution), ...goal.contributions];
        const currentAmount = getGoalCurrentAmount(contributions);
        return updateTrackedEntity(goal, { contributions, currentAmount, completed: currentAmount >= goal.targetAmount });
      }),
    });
  }

  deleteGoalContribution(goalId: string, contributionId: string): FinanceDeleteResult {
    const state = this.getState();
    const goal = state.goals.find((item) => item.id === goalId);

    if (!goal) {
      return blockedResult('Meta nao encontrada.');
    }

    const contributions = goal.contributions.filter((contribution) => contribution.id !== contributionId);
    const currentAmount = getGoalCurrentAmount(contributions);

    this.saveState({
      ...state,
      goals: state.goals.map((item) =>
        item.id === goalId
          ? updateTrackedEntity(item, { contributions, currentAmount, completed: currentAmount >= item.targetAmount })
          : item
      ),
    });
    return successResult('Contribuicao excluida.');
  }

  getMonthBalance(month: string, state = this.getState()): MonthlyBalance {
    const income = this.getMonthlyIncomes(month, state).reduce((total, item) => total + item.amount, 0);
    const cashExpense = this.getMonthlyDirectExpenses(month, state, 'cash');
    const pixExpense = this.getMonthlyDirectExpenses(month, state, 'pix');
    const creditCardExpense = this.getInstallments(state.expenses, state.cards)
      .filter((item) => item.month === month)
      .reduce((total, item) => total + item.amount, 0);
    const expense = cashExpense + pixExpense + creditCardExpense;

    return { month, income, expense, cashExpense, pixExpense, creditCardExpense, balance: income - expense };
  }

  getMonthlyIncomes(month: string, state = this.getState()): Income[] {
    return state.incomes.filter((income) => {
      if (income.recurring) {
        return income.active && month >= income.date.slice(0, 7);
      }

      return income.date.slice(0, 7) === month;
    });
  }

  getMonthlyLaunches(month: string, state = this.getState()): FinanceLaunch[] {
    const incomes = this.getMonthlyIncomes(month, state).map((income) => ({
      id: income.id,
      type: 'income' as const,
      description: income.description,
      category: income.category,
      date: income.recurring ? `${month}-${income.date.slice(8, 10)}` : income.date,
      paymentLabel: income.recurring ? 'Receita recorrente' : 'Receita avulsa',
      amount: income.amount,
      accountId: income.accountId,
    }));
    const directExpenses = state.expenses
      .filter((expense) => expense.paymentMethod !== 'credit-card' && expense.date.slice(0, 7) === month)
      .map((expense) => ({
        id: expense.id,
        type: 'expense' as const,
        description: expense.description,
        category: expense.category,
        date: expense.date,
        paymentLabel: getExpensePaymentLabel(expense, state),
        amount: -expense.amount,
        paymentMethod: expense.paymentMethod,
        accountId: expense.accountId,
      }));
    const installments = this.getInstallments(state.expenses, state.cards)
      .filter((installment) => installment.month === month)
      .map((installment) => ({
        id: `${installment.expenseId}-${installment.installmentNumber}`,
        type: 'card-installment' as const,
        description: installment.description,
        category: installment.category,
        date: installment.purchaseDate,
        paymentLabel: `${installment.cardName} ${installment.installmentNumber}/${installment.installments}`,
        amount: -installment.amount,
        paymentMethod: 'credit-card' as const,
        cardId: installment.cardId,
      }));

    return [...incomes, ...directExpenses, ...installments].sort((a, b) => b.date.localeCompare(a.date));
  }

  getInstallments(expenses = this.getState().expenses, cards = this.getState().cards): MonthlyInstallment[] {
    return expenses
      .filter((expense) => expense.paymentMethod === 'credit-card' && expense.cardId)
      .flatMap((expense) => {
        const card = cards.find((item) => item.id === expense.cardId);
        const installments = Math.max(expense.installments || 1, 1);
        const installmentAmount = expense.amount / installments;

        return Array.from({ length: installments }, (_, index) => {
          const monthDate = new Date(`${expense.date}T00:00:00`);
          monthDate.setMonth(monthDate.getMonth() + index);

          return {
            expenseId: expense.id,
            cardId: expense.cardId || '',
            cardName: card?.name || 'Cartão',
            description: expense.description,
            category: expense.category,
            purchaseDate: expense.date,
            month: toMonthKey(monthDate),
            installmentNumber: index + 1,
            installments,
            amount: installmentAmount,
          };
        });
      });
  }

  getCardInvoice(cardId: string, month: string, state = this.getState()): MonthlyInstallment[] {
    return this.getInstallments(state.expenses, state.cards).filter(
      (installment) => installment.cardId === cardId && installment.month === month
    );
  }

  getCardInvoiceTotal(cardId: string, month: string, state = this.getState()): number {
    return this.getCardInvoice(cardId, month, state).reduce((total, item) => total + item.amount, 0);
  }

  getCardUsedLimit(cardId: string, fromMonth: string, state = this.getState()): number {
    return this.getInstallments(state.expenses, state.cards)
      .filter((installment) => installment.cardId === cardId && installment.month >= fromMonth)
      .reduce((total, installment) => total + installment.amount, 0);
  }

  getMonthlySummaries(state = this.getState(), referenceMonth = toMonthKey(new Date())): MonthlySummary[] {
    return getMonthRange(referenceMonth, 6).map((month) => {
      const balance = this.getMonthBalance(month, state);

      return {
        month,
        label: formatMonthLabel(month),
        income: balance.income,
        expense: balance.expense,
        balance: balance.balance,
      };
    });
  }

  getCategoryTotals(month: string, state = this.getState()): Array<{ category: string; total: number }> {
    const totals = new Map<string, number>();

    for (const expense of state.expenses) {
      if (expense.paymentMethod !== 'credit-card' && expense.date.slice(0, 7) === month) {
        totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
      }
    }

    for (const installment of this.getInstallments(state.expenses, state.cards)) {
      if (installment.month === month) {
        totals.set(installment.category, (totals.get(installment.category) || 0) + installment.amount);
      }
    }

    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  getPaymentMethodTotals(month: string, state = this.getState()): Array<{ method: string; total: number }> {
    const balance = this.getMonthBalance(month, state);

    return [
      { method: 'Dinheiro', total: balance.cashExpense },
      { method: 'Pix', total: balance.pixExpense },
      { method: 'Cartão', total: balance.creditCardExpense },
    ].filter((item) => item.total > 0);
  }

  getInvestmentsTotal(state = this.getState()): number {
    return state.investments.reduce((total, investment) => total + Number(investment.currentAmount || 0), 0);
  }

  getInvestmentSummary(investment: Investment): InvestmentSummary {
    const investedAmount = Number(investment.investedAmount || 0);
    const currentAmount = Number(investment.currentAmount || 0);
    const gain = currentAmount - investedAmount;
    const gainPercent = investedAmount > 0 ? (gain / investedAmount) * 100 : 0;

    return { investment, gain, gainPercent };
  }

  getInvestmentGroups(state = this.getState()): InvestmentGroup[] {
    const groups = new Map<Investment['type'], InvestmentSummary[]>();

    for (const investment of state.investments) {
      const summary = this.getInvestmentSummary(investment);
      groups.set(investment.type, [...(groups.get(investment.type) || []), summary]);
    }

    return Array.from(groups.entries())
      .map(([type, items]) => ({
        type,
        items,
        totalInvested: items.reduce((total, item) => total + Number(item.investment.investedAmount || 0), 0),
        totalCurrent: items.reduce((total, item) => total + Number(item.investment.currentAmount || 0), 0),
        totalGain: items.reduce((total, item) => total + item.gain, 0),
      }))
      .sort((a, b) => b.totalCurrent - a.totalCurrent);
  }

  getAccountBalance(accountId: string, referenceMonth = toMonthKey(new Date()), state = this.getState()): number {
    const summary = this.getAccountSummary(accountId, referenceMonth, state);
    return summary?.estimatedBalance || 0;
  }

  getAccountSummaries(referenceMonth = toMonthKey(new Date()), state = this.getState()): AccountBalanceSummary[] {
    return state.accounts.map((account) => ({
      account,
      incomeTotal: this.getAccountIncomeTotal(account.id, referenceMonth, state),
      expenseTotal: this.getAccountExpenseTotal(account.id, referenceMonth, state),
      reservedTotal: this.getAccountReservedTotal(account.id, referenceMonth, state),
      investmentTotal: this.getAccountInvestmentTotal(account.id, referenceMonth, state),
      estimatedBalance: this.getAccountBalanceValue(account.id, referenceMonth, state),
    }));
  }

  getAccountSummary(
    accountId: string,
    referenceMonth = toMonthKey(new Date()),
    state = this.getState()
  ): AccountBalanceSummary | undefined {
    return this.getAccountSummaries(referenceMonth, state).find((summary) => summary.account.id === accountId);
  }

  getNetWorthSummary(referenceMonth = toMonthKey(new Date()), state = this.getState()): NetWorthSummary {
    const accountSummaries = this.getAccountSummaries(referenceMonth, state);
    const liquidBalance = accountSummaries.reduce((total, summary) => total + summary.estimatedBalance, 0);
    const reservedTotal = accountSummaries.reduce((total, summary) => total + summary.reservedTotal, 0);
    const investmentTotal = accountSummaries.reduce((total, summary) => total + summary.investmentTotal, 0);

    return {
      liquidBalance,
      reservedTotal,
      investmentTotal,
      netWorth: liquidBalance + reservedTotal + investmentTotal,
    };
  }

  getAccountsInitialTotal(state = this.getState()): number {
    return state.accounts.reduce((total, account) => total + Number(account.initialBalance || 0), 0);
  }

  getAccountLabel(accountId?: string, state = this.getState()): string {
    const account = state.accounts.find((item) => item.id === accountId);
    return account ? formatAccountLabel(account) : 'Conta não informada';
  }

  private getMonthlyDirectExpenses(month: string, state: FinanceState, method: 'cash' | 'pix'): number {
    return state.expenses
      .filter((expense) => expense.paymentMethod === method && expense.date.slice(0, 7) === month)
      .reduce((total, expense) => total + expense.amount, 0);
  }

  private getAccountBalanceValue(accountId: string, referenceMonth: string, state: FinanceState): number {
    const account = state.accounts.find((item) => item.id === accountId);
    if (!account) {
      return 0;
    }

    return (
      Number(account.initialBalance || 0) +
      this.getAccountIncomeTotal(accountId, referenceMonth, state) -
      this.getAccountExpenseTotal(accountId, referenceMonth, state) -
      this.getAccountReservedTotal(accountId, referenceMonth, state) -
      this.getAccountInvestmentTotal(accountId, referenceMonth, state)
    );
  }

  private getAccountIncomeTotal(accountId: string, referenceMonth: string, state: FinanceState): number {
    return state.incomes
      .filter((income) => income.accountId === accountId)
      .reduce((total, income) => total + getIncomeTotalUntilMonth(income, referenceMonth), 0);
  }

  private getAccountReservedTotal(accountId: string, referenceMonth: string, state: FinanceState): number {
    return state.goals.reduce(
      (total, goal) =>
        total +
        goal.contributions
          .filter((contribution) => contribution.accountId === accountId && contribution.date.slice(0, 7) <= referenceMonth)
          .reduce((goalTotal, contribution) => goalTotal + Number(contribution.amount || 0), 0),
      0
    );
  }

  private getAccountExpenseTotal(accountId: string, referenceMonth: string, state: FinanceState): number {
    return state.expenses
      .filter(
        (expense) =>
          expense.accountId === accountId &&
          expense.paymentMethod !== 'credit-card' &&
          expense.date.slice(0, 7) <= referenceMonth
      )
      .reduce((total, expense) => total + Number(expense.amount || 0), 0);
  }

  private getAccountInvestmentTotal(accountId: string, referenceMonth: string, state: FinanceState): number {
    return state.investments
      .filter((investment) => investment.accountId === accountId && investment.startDate.slice(0, 7) <= referenceMonth)
      .reduce((total, investment) => total + Number(investment.currentAmount || 0), 0);
  }

  private saveState(state: FinanceState): void {
    this.financeRepository.save(this.storageKey, state).subscribe((savedState) => {
      this.stateSubject.next(savedState);
    });
  }

  private loadState(): void {
    this.financeRepository.load(this.storageKey).subscribe((state) => {
      this.stateSubject.next(state);
    });
  }

  private get storageKey(): string {
    const user = this.authService.getStoredUserName() || 'guest';
    return `FinanceState:${user}`;
  }
}

export function toCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getGoalCurrentAmount(contributions: GoalContribution[]): number {
  return contributions.reduce((total, contribution) => total + Number(contribution.amount || 0), 0);
}

function getExpensePaymentLabel(expense: Expense, state: FinanceState): string {
  if (expense.paymentMethod === 'credit-card') {
    const card = state.cards.find((item) => item.id === expense.cardId);
    return card ? formatPaymentSourceLabel('Cartao', card.name) : 'Cartao';
  }

  const account = state.accounts.find((item) => item.id === expense.accountId);
  if (account) {
    return formatPaymentSourceLabel('Pix', account.accountName || account.bankName);
  }

  return expense.paymentMethod === 'cash' ? 'Dinheiro' : 'Pix';
}

function formatAccountLabel(account: BankAccount): string {
  const bankName = account.bankName.trim();
  const accountName = account.accountName.trim();

  if (!bankName) {
    return accountName;
  }

  if (!accountName || normalizeLabel(accountName).includes(normalizeLabel(bankName))) {
    return accountName || bankName;
  }

  return `${bankName} · ${accountName}`;
}

function formatPaymentSourceLabel(prefix: 'Pix' | 'Cartao', name: string): string {
  const cleanName = name.trim();
  const normalizedPrefix = normalizeLabel(prefix);
  const normalizedName = normalizeLabel(cleanName);

  if (!cleanName) {
    return prefix;
  }

  return normalizedName.startsWith(normalizedPrefix) ? cleanName : `${prefix} - ${cleanName}`;
}

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getIncomeTotalUntilMonth(income: Income, referenceMonth: string): number {
  const incomeMonth = income.date.slice(0, 7);
  if (incomeMonth > referenceMonth) {
    return 0;
  }

  if (!income.recurring) {
    return income.amount;
  }

  if (!income.active) {
    return 0;
  }

  return income.amount * getInclusiveMonthDistance(incomeMonth, referenceMonth);
}

function getInclusiveMonthDistance(startMonth: string, endMonth: string): number {
  const [startYear, startMonthIndex] = startMonth.split('-').map(Number);
  const [endYear, endMonthIndex] = endMonth.split('-').map(Number);
  return (endYear - startYear) * 12 + endMonthIndex - startMonthIndex + 1;
}

function successResult(message: string): FinanceDeleteResult {
  return { success: true, message };
}

function blockedResult(message: string): FinanceDeleteResult {
  return { success: false, message };
}

function appendInvestmentNote(currentNotes: string | undefined, note: string): string {
  return currentNotes ? `${currentNotes}\n${note}` : note;
}

function createTrackedEntity<T extends object>(entity: T): T & FinanceSyncMetadata & { id: string } {
  const timestamp = new Date().toISOString();

  return {
    ...entity,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  };
}

function updateTrackedEntity<T extends FinanceSyncMetadata & { id: string }, U extends object>(current: T, changes: U): T & U {
  return {
    ...current,
    ...changes,
    id: current.id,
    createdAt: current.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: Number(current.version || 1) + 1,
  };
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRange(referenceMonth: string, count: number): string[] {
  const [year, monthIndex] = referenceMonth.split('-').map(Number);
  const start = new Date(year, monthIndex - count, 1);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index + 1);
    return toMonthKey(date);
  });
}

function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(year, monthIndex - 1, 1));
}
