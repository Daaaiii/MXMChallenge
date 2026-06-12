import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import {
  BankAccount,
  AccountBalanceSummary,
  CreditCard,
  Expense,
  FinanceCategory,
  FinanceGoal,
  FinanceLaunch,
  FinanceState,
  Income,
  IncomeCategory,
  Investment,
  InvestmentGroup,
  InvestmentIndexer,
  InvestmentLiquidity,
  InvestmentRedemptionRequest,
  InvestmentType,
  MonthlyInstallment,
  PaymentMethod,
} from '../../models/finance';
import { FinanceService, toCurrency } from '../../services/finance.service';
import { FinanceSyncStatusService, FinanceSyncStatusState } from '../../services/finance-sync-status.service';
import { FeedbackModalService } from '../../services/feedback-modal.service';

type FinanceTab =
  | 'dashboard'
  | 'accounts'
  | 'incomes'
  | 'expenses'
  | 'cards'
  | 'invoices'
  | 'goals'
  | 'investments'
  | 'charts';

type PaymentSourceOption = {
  value: string;
  label: string;
  method: PaymentMethod;
};

const EXPENSE_CATEGORIES: FinanceCategory[] = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Cartão',
  'Outros',
];

const INCOME_CATEGORIES: IncomeCategory[] = ['Salário', 'Pagamento', 'Reembolso', 'Freelance', 'Outros'];
const INVESTMENT_TYPES: InvestmentType[] = ['Reserva', 'CDB', 'Tesouro Direto', 'Fundo', 'Ações', 'Outros'];
const INVESTMENT_INDEXERS: InvestmentIndexer[] = ['CDI', 'IPCA', 'Prefixado', 'Selic', 'Outro'];
const INVESTMENT_LIQUIDITIES: InvestmentLiquidity[] = ['Diaria', 'No vencimento', 'Sem liquidez', 'Outro'];

@Component({
  selector: 'app-finance',
  imports: [ReactiveFormsModule, SidebarComponent],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css',
})
export class FinanceComponent implements OnInit {
  readonly expenseCategories = EXPENSE_CATEGORIES;
  readonly incomeCategories = INCOME_CATEGORIES;
  readonly investmentTypes = INVESTMENT_TYPES;
  readonly investmentIndexers = INVESTMENT_INDEXERS;
  readonly investmentLiquidities = INVESTMENT_LIQUIDITIES;
  activeTab: FinanceTab = 'dashboard';
  selectedMonth = new Date().toISOString().slice(0, 7);
  state: FinanceState = this.financeService.getState();
  syncStatus: FinanceSyncStatusState = this.financeSyncStatus.snapshot();
  editingIncomeId = '';
  editingExpenseId = '';
  editingCardId = '';
  editingGoalId = '';
  editingAccountId = '';
  editingInvestmentId = '';

  incomeForm = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(3)]],
    category: ['Salário' as IncomeCategory, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    recurring: [true],
    accountId: [''],
  });

  accountForm = this.fb.group({
    bankName: ['', [Validators.required, Validators.minLength(2)]],
    accountName: ['', [Validators.required, Validators.minLength(2)]],
    accountType: ['Conta corrente' as BankAccount['accountType'], Validators.required],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
  });

  expenseForm = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(3)]],
    category: ['Alimentação' as FinanceCategory, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    paymentSource: ['', Validators.required],
    paymentMethod: ['pix' as PaymentMethod, Validators.required],
    accountId: [''],
    cardId: [''],
    installments: [1, [Validators.required, Validators.min(1), Validators.max(48)]],
    notes: [''],
  });

  cardForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    limit: [0, [Validators.required, Validators.min(0)]],
    closingDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    dueDay: [10, [Validators.required, Validators.min(1), Validators.max(31)]],
  });

  goalForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    targetAmount: [0, [Validators.required, Validators.min(1)]],
    deadline: [new Date().toISOString().slice(0, 10), Validators.required],
    accountId: [''],
  });

  contributionForm = this.fb.group({
    goalId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    accountId: [''],
    notes: [''],
  });

  investmentForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['Reserva' as InvestmentType, Validators.required],
    institution: ['', [Validators.required, Validators.minLength(2)]],
    accountId: [''],
    investedAmount: [0, [Validators.required, Validators.min(0.01)]],
    currentAmount: [0, [Validators.required, Validators.min(0.01)]],
    profitabilityRate: [0, [Validators.min(0)]],
    indexer: ['CDI' as InvestmentIndexer],
    liquidity: ['Diaria' as InvestmentLiquidity],
    startDate: [new Date().toISOString().slice(0, 10), Validators.required],
    maturityDate: [''],
    liquidityDate: [''],
    notes: [''],
  });

  redemptionForm = this.fb.group({
    investmentId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    accountId: ['', Validators.required],
    notes: [''],
  });

  filterForm = this.fb.group({
    category: [''],
    paymentMethod: [''],
    accountId: [''],
    cardId: [''],
  });

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private financeSyncStatus: FinanceSyncStatusService,
    private feedbackModal: FeedbackModalService
  ) {}

  ngOnInit(): void {
    this.financeSyncStatus.status$.subscribe((status) => {
      this.syncStatus = status;
    });

    this.financeService.state$.subscribe((state) => {
      this.state = state;
      if (!this.contributionForm.get('goalId')?.value && state.goals.length) {
        this.contributionForm.patchValue({ goalId: state.goals[0].id }, { emitEvent: false });
      }
      if (!this.redemptionForm.get('investmentId')?.value && state.investments.length) {
        this.redemptionForm.patchValue({ investmentId: state.investments[0].id }, { emitEvent: false });
      }
      if (!this.redemptionForm.get('accountId')?.value && state.accounts.length) {
        this.redemptionForm.patchValue({ accountId: state.accounts[0].id }, { emitEvent: false });
      }
    });
  }

  saveIncome(): void {
    if (this.incomeForm.invalid) {
      this.incomeForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const income = this.readIncomeForm();
    if (this.editingIncomeId) {
      this.financeService.updateIncome(this.editingIncomeId, income);
      this.cancelIncomeEdit();
      return;
    }

    this.financeService.addIncome(income);
    this.incomeForm.patchValue({ description: '', amount: 0 });
  }

  editIncome(income: Income): void {
    this.editingIncomeId = income.id;
    this.activeTab = 'incomes';
    this.incomeForm.setValue({
      description: income.description,
      category: income.category,
      amount: income.amount,
      date: income.date,
      recurring: income.recurring,
      accountId: income.accountId || '',
    });
  }

  cancelIncomeEdit(): void {
    this.editingIncomeId = '';
    this.incomeForm.reset({
      description: '',
      category: 'Salário',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      recurring: true,
      accountId: '',
    });
  }

  saveAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const account = this.readAccountForm();
    if (this.editingAccountId) {
      this.financeService.updateAccount(this.editingAccountId, account);
      this.cancelAccountEdit();
      return;
    }

    this.financeService.addAccount(account);
    this.cancelAccountEdit();
  }

  editAccount(account: BankAccount): void {
    this.editingAccountId = account.id;
    this.accountForm.setValue({
      bankName: account.bankName,
      accountName: account.accountName,
      accountType: account.accountType,
      initialBalance: account.initialBalance,
    });
  }

  cancelAccountEdit(): void {
    this.editingAccountId = '';
    this.accountForm.reset({
      bankName: '',
      accountName: '',
      accountType: 'Conta corrente',
      initialBalance: 0,
    });
  }

  saveExpense(): void {
    this.applyPaymentValidators();

    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const expense = this.readExpenseForm();
    if (this.editingExpenseId) {
      this.financeService.updateExpense(this.editingExpenseId, expense);
      this.cancelExpenseEdit();
      return;
    }

    this.financeService.addExpense(expense);
    this.expenseForm.patchValue({
      description: '',
      amount: 0,
      paymentSource: this.defaultPaymentSource(),
      paymentMethod: 'pix',
      accountId: '',
      cardId: '',
      installments: 1,
      notes: '',
    });
    this.applyPaymentValidators();
  }

  editExpense(expense: Expense): void {
    this.editingExpenseId = expense.id;
    this.activeTab = 'expenses';
    this.expenseForm.setValue({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      paymentSource: this.getExpensePaymentSource(expense),
      paymentMethod: expense.paymentMethod,
      accountId: expense.accountId || '',
      cardId: expense.cardId || '',
      installments: expense.installments,
      notes: expense.notes || '',
    });
    this.applyPaymentValidators();
  }

  cancelExpenseEdit(): void {
    this.editingExpenseId = '';
    this.expenseForm.reset({
      description: '',
      category: 'Alimentação',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      paymentSource: this.defaultPaymentSource(),
      paymentMethod: 'pix',
      accountId: '',
      cardId: '',
      installments: 1,
      notes: '',
    });
    this.applyPaymentValidators();
  }

  saveCard(): void {
    if (this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const card = this.readCardForm();
    if (this.editingCardId) {
      this.financeService.updateCard(this.editingCardId, card);
      this.cancelCardEdit();
      return;
    }

    this.financeService.addCard(card);
    this.cancelCardEdit();
  }

  editCard(card: CreditCard): void {
    this.editingCardId = card.id;
    this.cardForm.setValue({
      name: card.name,
      limit: card.limit,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
    });
  }

  cancelCardEdit(): void {
    this.editingCardId = '';
    this.cardForm.reset({ name: '', limit: 0, closingDay: 1, dueDay: 10 });
  }

  saveGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const formGoal = this.goalForm.getRawValue();
    if (this.editingGoalId) {
      const goal = this.state.goals.find((item) => item.id === this.editingGoalId);
      if (goal) {
        this.financeService.updateGoal(this.editingGoalId, {
          name: formGoal.name || '',
          targetAmount: Number(formGoal.targetAmount || 0),
          deadline: formGoal.deadline || new Date().toISOString().slice(0, 10),
          accountId: formGoal.accountId || undefined,
          contributions: goal.contributions,
        });
      }
      this.cancelGoalEdit();
      return;
    }

    this.financeService.addGoal({
      name: formGoal.name || '',
      targetAmount: Number(formGoal.targetAmount || 0),
      currentAmount: 0,
      deadline: formGoal.deadline || new Date().toISOString().slice(0, 10),
      accountId: formGoal.accountId || undefined,
    });
    this.cancelGoalEdit();
  }

  editGoal(goal: FinanceGoal): void {
    this.editingGoalId = goal.id;
    this.goalForm.setValue({
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline,
      accountId: goal.accountId || '',
    });
    this.contributionForm.patchValue({ goalId: goal.id });
  }

  cancelGoalEdit(): void {
    this.editingGoalId = '';
    this.goalForm.reset({
      name: '',
      targetAmount: 0,
      deadline: new Date().toISOString().slice(0, 10),
      accountId: '',
    });
  }

  addGoalContribution(): void {
    if (this.contributionForm.invalid) {
      this.contributionForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const contribution = this.contributionForm.getRawValue();
    this.financeService.addGoalContribution(contribution.goalId || '', {
      amount: Number(contribution.amount || 0),
      date: contribution.date || new Date().toISOString().slice(0, 10),
      accountId: contribution.accountId || undefined,
      notes: contribution.notes || undefined,
    });
    this.contributionForm.patchValue({ amount: 0, notes: '' });
  }

  deleteIncome(incomeId: string): void {
    this.confirmDelete('Excluir esta entrada?', () => {
      this.showDeleteResult(this.financeService.deleteIncome(incomeId));
      if (this.editingIncomeId === incomeId) {
        this.cancelIncomeEdit();
      }
    });
  }

  deleteExpense(expenseId: string): void {
    this.confirmDelete('Excluir esta despesa?', () => {
      this.showDeleteResult(this.financeService.deleteExpense(expenseId));
      if (this.editingExpenseId === expenseId) {
        this.cancelExpenseEdit();
      }
    });
  }

  deleteAccount(accountId: string): void {
    this.confirmDelete('Excluir esta conta?', () => {
      const result = this.financeService.deleteAccount(accountId);
      this.showDeleteResult(result);
      if (result.success && this.editingAccountId === accountId) {
        this.cancelAccountEdit();
      }
    });
  }

  deleteCard(cardId: string): void {
    this.confirmDelete('Excluir este cartao?', () => {
      const result = this.financeService.deleteCard(cardId);
      this.showDeleteResult(result);
      if (result.success && this.editingCardId === cardId) {
        this.cancelCardEdit();
      }
    });
  }

  deleteGoal(goalId: string): void {
    this.confirmDelete('Excluir esta meta?', () => {
      const result = this.financeService.deleteGoal(goalId);
      this.showDeleteResult(result);
      if (result.success && this.editingGoalId === goalId) {
        this.cancelGoalEdit();
      }
    });
  }

  deleteGoalContribution(goalId: string, contributionId: string): void {
    this.confirmDelete('Excluir esta contribuicao?', () => {
      this.showDeleteResult(this.financeService.deleteGoalContribution(goalId, contributionId));
    });
  }

  deleteInvestment(investmentId: string): void {
    this.confirmDelete('Excluir este investimento?', () => {
      this.showDeleteResult(this.financeService.deleteInvestment(investmentId));
      if (this.editingInvestmentId === investmentId) {
        this.cancelInvestmentEdit();
      }
    });
  }

  redeemInvestment(): void {
    if (this.redemptionForm.invalid) {
      this.redemptionForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const result = this.financeService.redeemInvestment(this.readRedemptionForm());
    this.showDeleteResult(result);
    if (result.success) {
      this.redemptionForm.patchValue({ amount: 0, notes: '' });
    }
  }

  saveInvestment(): void {
    if (this.investmentForm.invalid) {
      this.investmentForm.markAllAsTouched();
      this.showInvalidFormWarning();
      return;
    }

    const investment = this.readInvestmentForm();
    if (this.editingInvestmentId) {
      this.financeService.updateInvestment(this.editingInvestmentId, investment);
      this.cancelInvestmentEdit();
      return;
    }

    this.financeService.addInvestment(investment);
    this.cancelInvestmentEdit();
  }

  editInvestment(investment: Investment): void {
    this.editingInvestmentId = investment.id;
    this.investmentForm.setValue({
      name: investment.name,
      type: investment.type,
      institution: investment.institution,
      accountId: investment.accountId || '',
      investedAmount: investment.investedAmount,
      currentAmount: investment.currentAmount,
      profitabilityRate: investment.profitabilityRate || 0,
      indexer: investment.indexer || 'CDI',
      liquidity: investment.liquidity || 'Diaria',
      startDate: investment.startDate,
      maturityDate: investment.maturityDate || '',
      liquidityDate: investment.liquidityDate || '',
      notes: investment.notes || '',
    });
  }

  cancelInvestmentEdit(): void {
    this.editingInvestmentId = '';
    this.investmentForm.reset({
      name: '',
      type: 'Reserva',
      institution: '',
      accountId: '',
      investedAmount: 0,
      currentAmount: 0,
      profitabilityRate: 0,
      indexer: 'CDI',
      liquidity: 'Diaria',
      startDate: new Date().toISOString().slice(0, 10),
      maturityDate: '',
      liquidityDate: '',
      notes: '',
    });
  }

  setTab(tab: FinanceTab): void {
    this.activeTab = tab;
  }

  onMonthChange(event: Event): void {
    this.selectedMonth = (event.target as HTMLInputElement).value || this.selectedMonth;
  }

  onPaymentMethodChange(): void {
    this.applyPaymentValidators();
  }

  isCreditCardPayment(): boolean {
    return this.selectedPaymentSource()?.method === 'credit-card';
  }

  monthlyBalance() {
    return this.financeService.getMonthBalance(this.selectedMonth, this.state);
  }

  monthlyIncomes() {
    return this.financeService.getMonthlyIncomes(this.selectedMonth, this.state);
  }

  filteredMonthlyIncomes(): Income[] {
    return this.monthlyIncomes().filter((income) => this.matchesIncomeFilters(income));
  }

  monthlyExpenses() {
    return [...this.state.expenses]
      .filter((expense) => expense.paymentMethod !== 'credit-card' && expense.date.slice(0, 7) === this.selectedMonth)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  cardExpenses() {
    return [...this.state.expenses]
      .filter((expense) => expense.paymentMethod === 'credit-card')
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  monthlyLaunches() {
    return this.financeService.getMonthlyLaunches(this.selectedMonth, this.state);
  }

  filteredMonthlyLaunches(): FinanceLaunch[] {
    return this.monthlyLaunches().filter((launch) => this.matchesLaunchFilters(launch));
  }

  filteredMonthlyExpenses(): Expense[] {
    return this.monthlyExpenses().filter((expense) => this.matchesExpenseFilters(expense));
  }

  filteredCardExpenses(): Expense[] {
    return this.cardExpenses().filter((expense) => this.matchesExpenseFilters(expense));
  }

  allFilterCategories(): string[] {
    return Array.from(new Set([...this.incomeCategories, ...this.expenseCategories]));
  }

  clearFilters(): void {
    this.filterForm.reset({
      category: '',
      paymentMethod: '',
      accountId: '',
      cardId: '',
    });
  }

  hasActiveFilters(): boolean {
    const filters = this.filterForm.getRawValue();
    return !!(filters.category || filters.paymentMethod || filters.accountId || filters.cardId);
  }

  openInstallments(): MonthlyInstallment[] {
    return this.financeService
      .getInstallments(this.state.expenses, this.state.cards)
      .filter((item) => item.month >= this.selectedMonth)
      .slice(0, 12);
  }

  cardInvoice(cardId: string): MonthlyInstallment[] {
    return this.financeService.getCardInvoice(cardId, this.selectedMonth, this.state);
  }

  cardInvoiceTotal(cardId: string): number {
    return this.financeService.getCardInvoiceTotal(cardId, this.selectedMonth, this.state);
  }

  cardUsedLimit(cardId: string): number {
    return this.financeService.getCardUsedLimit(cardId, this.selectedMonth, this.state);
  }

  cardAvailableLimit(cardId: string, limit: number): number {
    return Math.max(limit - this.cardUsedLimit(cardId), 0);
  }

  cardUsagePercent(cardId: string, limit: number): number {
    return Math.min((this.cardUsedLimit(cardId) / Math.max(limit, 1)) * 100, 100);
  }

  monthlySummaries() {
    return this.financeService.getMonthlySummaries(this.state, this.selectedMonth);
  }

  filteredMonthlySummaries() {
    return this.monthlySummaries().map((summary) => {
      const launches = this.financeService
        .getMonthlyLaunches(summary.month, this.state)
        .filter((launch) => this.matchesLaunchFilters(launch));
      const income = launches
        .filter((launch) => launch.type === 'income')
        .reduce((total, launch) => total + Number(launch.amount || 0), 0);
      const expense = launches
        .filter((launch) => launch.type !== 'income')
        .reduce((total, launch) => total + Math.abs(Number(launch.amount || 0)), 0);

      return {
        ...summary,
        income,
        expense,
        balance: income - expense,
      };
    });
  }

  categoryTotals() {
    return this.financeService.getCategoryTotals(this.selectedMonth, this.state);
  }

  filteredCategoryTotals(): Array<{ category: string; total: number }> {
    const totals = new Map<string, number>();

    for (const launch of this.filteredMonthlyLaunches()) {
      if (launch.type === 'income') {
        continue;
      }

      totals.set(launch.category, (totals.get(launch.category) || 0) + Math.abs(Number(launch.amount || 0)));
    }

    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  paymentMethodTotals() {
    return this.financeService.getPaymentMethodTotals(this.selectedMonth, this.state);
  }

  filteredPaymentMethodTotals(): Array<{ method: string; total: number }> {
    const totals = new Map<string, number>();

    for (const launch of this.filteredMonthlyLaunches()) {
      if (launch.type === 'income') {
        continue;
      }

      const label = launch.paymentMethod ? this.paymentMethodLabel(launch.paymentMethod) : launch.paymentLabel;
      totals.set(label, (totals.get(label) || 0) + Math.abs(Number(launch.amount || 0)));
    }

    return Array.from(totals.entries())
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);
  }

  paymentSourceOptions(): PaymentSourceOption[] {
    const accountOptions = this.state.accounts.map((account) => ({
      value: `pix:${account.id}`,
      label: formatPaymentSourceLabel('Pix', account.accountName || account.bankName),
      method: 'pix' as PaymentMethod,
    }));
    const cardOptions = this.state.cards.map((card) => ({
      value: `card:${card.id}`,
      label: formatPaymentSourceLabel('Cartao', card.name),
      method: 'credit-card' as PaymentMethod,
    }));

    return [...accountOptions, ...cardOptions];
  }

  barHeight(total: number): number {
    const max = Math.max(...this.filteredMonthlySummaries().map((item) => item.expense), 1);
    return Math.max((total / max) * 160, 8);
  }

  goalProgress(currentAmount: number, targetAmount: number): number {
    return Math.min((currentAmount / Math.max(targetAmount, 1)) * 100, 100);
  }

  hasNegativeBalance(): boolean {
    return this.monthlyBalance().balance < 0;
  }

  hasCardNearLimit(): boolean {
    return this.state.cards.some((card) => this.cardUsagePercent(card.id, card.limit) >= 80);
  }

  hasOverdueGoal(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return this.state.goals.some((goal) => goal.deadline < today && !goal.completed);
  }

  completedGoalsCount(): number {
    return this.state.goals.filter((goal) => goal.completed).length;
  }

  investmentsTotal(): number {
    return this.financeService.getInvestmentsTotal(this.state);
  }

  investmentGroups(): InvestmentGroup[] {
    return this.financeService.getInvestmentGroups(this.state);
  }

  investmentGain(investment: Investment): number {
    return this.financeService.getInvestmentSummary(investment).gain;
  }

  investmentGainPercent(investment: Investment): number {
    return this.financeService.getInvestmentSummary(investment).gainPercent;
  }

  percent(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  accountsInitialTotal(): number {
    return this.financeService.getAccountsInitialTotal(this.state);
  }

  accountSummaries(): AccountBalanceSummary[] {
    return this.financeService.getAccountSummaries(this.selectedMonth, this.state);
  }

  accountBalance(accountId: string): number {
    return this.financeService.getAccountBalance(accountId, this.selectedMonth, this.state);
  }

  netWorthSummary() {
    return this.financeService.getNetWorthSummary(this.selectedMonth, this.state);
  }

  accountLabel(accountId?: string): string {
    return this.financeService.getAccountLabel(accountId, this.state);
  }

  accountOptionLabel(account: BankAccount): string {
    return formatAccountLabel(account);
  }

  paymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      cash: 'Dinheiro',
      pix: 'Pix',
      'credit-card': 'Cartão',
    };

    return labels[method];
  }

  syncConflictLabel(entity: string): string {
    const labels: Record<string, string> = {
      incomes: 'Entrada',
      expenses: 'Despesa',
      cards: 'Cartao',
      goals: 'Meta',
      accounts: 'Conta',
      investments: 'Investimento',
    };

    return labels[entity] || entity;
  }

  expensePaymentLabel(expense: Expense): string {
    if (expense.paymentMethod === 'credit-card') {
      const card = this.state.cards.find((item) => item.id === expense.cardId);
      return card ? formatPaymentSourceLabel('Cartao', card.name) : 'Cartao';
    }

    const account = this.state.accounts.find((item) => item.id === expense.accountId);
    return account
      ? formatPaymentSourceLabel('Pix', account.accountName || account.bankName)
      : this.paymentMethodLabel(expense.paymentMethod);
  }

  currency(value: number): string {
    return toCurrency(value);
  }

  private confirmDelete(message: string, onConfirm: () => void): void {
    this.feedbackModal.confirm(message, 'Confirmar exclusao').subscribe((confirmed) => {
      if (confirmed) {
        onConfirm();
      }
    });
  }

  private showDeleteResult(result: { success: boolean; message: string }): void {
    if (result.success) {
      this.feedbackModal.showSuccess(result.message, 'Acao concluida');
      return;
    }

    this.feedbackModal.showError(result.message, 'Nao foi possivel concluir');
  }

  private showInvalidFormWarning(): void {
    this.feedbackModal.showWarning('Revise os campos obrigatorios antes de continuar.', 'Formulario invalido');
  }

  private matchesLaunchFilters(launch: FinanceLaunch): boolean {
    const filters = this.filterForm.getRawValue();

    if (filters.category && launch.category !== filters.category) {
      return false;
    }

    if (filters.accountId && launch.accountId !== filters.accountId) {
      return false;
    }

    if (filters.cardId && launch.cardId !== filters.cardId) {
      return false;
    }

    if (filters.paymentMethod === 'income') {
      return launch.type === 'income';
    }

    if (filters.paymentMethod && launch.paymentMethod !== filters.paymentMethod) {
      return false;
    }

    return true;
  }

  private matchesExpenseFilters(expense: Expense): boolean {
    const filters = this.filterForm.getRawValue();

    if (filters.category && expense.category !== filters.category) {
      return false;
    }

    if (filters.accountId && expense.accountId !== filters.accountId) {
      return false;
    }

    if (filters.cardId && expense.cardId !== filters.cardId) {
      return false;
    }

    if (filters.paymentMethod === 'income') {
      return false;
    }

    if (filters.paymentMethod && expense.paymentMethod !== filters.paymentMethod) {
      return false;
    }

    return true;
  }

  private matchesIncomeFilters(income: Income): boolean {
    const filters = this.filterForm.getRawValue();

    if (filters.category && income.category !== filters.category) {
      return false;
    }

    if (filters.accountId && income.accountId !== filters.accountId) {
      return false;
    }

    if (filters.cardId) {
      return false;
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'income') {
      return false;
    }

    return true;
  }

  private readIncomeForm(): Omit<Income, 'id'> {
    const income = this.incomeForm.getRawValue();
    return {
      description: income.description || '',
      category: income.category || 'Outros',
      amount: Number(income.amount || 0),
      date: income.date || new Date().toISOString().slice(0, 10),
      recurring: !!income.recurring,
      active: true,
      accountId: income.accountId || undefined,
    };
  }

  private readAccountForm(): Omit<BankAccount, 'id'> {
    const account = this.accountForm.getRawValue();
    return {
      bankName: account.bankName || '',
      accountName: account.accountName || '',
      accountType: account.accountType || 'Conta corrente',
      initialBalance: Number(account.initialBalance || 0),
    };
  }

  private readExpenseForm(): Omit<Expense, 'id'> {
    const expense = this.expenseForm.getRawValue();
    const source = parsePaymentSource(expense.paymentSource || '');
    const paymentMethod = source?.method || expense.paymentMethod || 'pix';
    return {
      description: expense.description || '',
      category: expense.category || 'Outros',
      amount: Number(expense.amount || 0),
      date: expense.date || new Date().toISOString().slice(0, 10),
      paymentMethod,
      accountId: paymentMethod !== 'credit-card' ? source?.id || expense.accountId || undefined : undefined,
      cardId: paymentMethod === 'credit-card' ? expense.cardId || undefined : undefined,
      installments: paymentMethod === 'credit-card' ? Number(expense.installments || 1) : 1,
      notes: expense.notes || undefined,
    };
  }

  private readCardForm(): Omit<CreditCard, 'id'> {
    const card = this.cardForm.getRawValue();
    return {
      name: card.name || '',
      limit: Number(card.limit || 0),
      closingDay: Number(card.closingDay || 1),
      dueDay: Number(card.dueDay || 10),
    };
  }

  private readInvestmentForm(): Omit<Investment, 'id'> {
    const investment = this.investmentForm.getRawValue();
    return {
      name: investment.name || '',
      type: investment.type || 'Reserva',
      institution: investment.institution || '',
      accountId: investment.accountId || undefined,
      investedAmount: Number(investment.investedAmount || 0),
      currentAmount: Number(investment.currentAmount || 0),
      profitabilityRate: Number(investment.profitabilityRate || 0) || undefined,
      indexer: investment.indexer || undefined,
      liquidity: investment.liquidity || undefined,
      startDate: investment.startDate || new Date().toISOString().slice(0, 10),
      maturityDate: investment.maturityDate || undefined,
      liquidityDate: investment.liquidityDate || undefined,
      notes: investment.notes || undefined,
    };
  }

  private readRedemptionForm(): InvestmentRedemptionRequest {
    const redemption = this.redemptionForm.getRawValue();
    return {
      investmentId: redemption.investmentId || '',
      amount: Number(redemption.amount || 0),
      date: redemption.date || new Date().toISOString().slice(0, 10),
      accountId: redemption.accountId || '',
      notes: redemption.notes || undefined,
    };
  }

  private applyPaymentValidators(): void {
    const source = this.selectedPaymentSource();
    this.expenseForm.patchValue(
      {
        paymentMethod: source?.method || 'pix',
        accountId: source?.method === 'credit-card' ? '' : source?.id || '',
        cardId: source?.method === 'credit-card' ? source.id : '',
        installments: source?.method === 'credit-card' ? this.expenseForm.get('installments')?.value || 1 : 1,
      },
      { emitEvent: false }
    );

    const sourceControl = this.expenseForm.get('paymentSource');
    const cardControl = this.expenseForm.get('cardId');
    const installmentsControl = this.expenseForm.get('installments');

    if (!sourceControl || !cardControl || !installmentsControl) {
      return;
    }

    sourceControl.setValidators([Validators.required]);

    if (this.isCreditCardPayment()) {
      cardControl.clearValidators();
      installmentsControl.setValidators([Validators.required, Validators.min(1), Validators.max(48)]);
    } else {
      cardControl.clearValidators();
      installmentsControl.setValidators([Validators.required, Validators.min(1), Validators.max(1)]);
    }

    sourceControl.updateValueAndValidity({ emitEvent: false });
    cardControl.updateValueAndValidity({ emitEvent: false });
    installmentsControl.updateValueAndValidity({ emitEvent: false });
  }

  private selectedPaymentSource(): { type: string; id: string; method: PaymentMethod } | undefined {
    return parsePaymentSource(this.expenseForm.get('paymentSource')?.value || '');
  }

  private defaultPaymentSource(): string {
    return this.paymentSourceOptions()[0]?.value || '';
  }

  private getExpensePaymentSource(expense: Expense): string {
    if (expense.paymentMethod === 'credit-card' && expense.cardId) {
      return `card:${expense.cardId}`;
    }

    return expense.accountId ? `pix:${expense.accountId}` : '';
  }
}

function parsePaymentSource(value: string): { type: string; id: string; method: PaymentMethod } | undefined {
  const [type, id] = value.split(':');
  if (!type || !id) {
    return undefined;
  }

  return {
    type,
    id,
    method: type === 'card' ? 'credit-card' : 'pix',
  };
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

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
