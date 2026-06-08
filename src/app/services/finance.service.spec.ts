import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { BrowserStorageService } from './browser-storage.service';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let storage: jasmine.SpyObj<BrowserStorageService>;

  beforeEach(() => {
    storage = jasmine.createSpyObj<BrowserStorageService>('BrowserStorageService', ['getItem', 'setItem']);
    storage.getItem.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        FinanceService,
        { provide: BrowserStorageService, useValue: storage },
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['getStoredUserName']) },
      ],
    });

    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    auth.getStoredUserName.and.returnValue('User Test');
    service = TestBed.inject(FinanceService);
  });

  it('includes recurring salary in current and future months', () => {
    service.addIncome({
      description: 'Salário',
      category: 'Salário',
      amount: 5000,
      date: '2026-01-05',
      recurring: true,
      active: true,
    });

    expect(service.getMonthBalance('2026-01').income).toBe(5000);
    expect(service.getMonthBalance('2026-03').income).toBe(5000);
  });

  it('includes one-time income only in the informed month', () => {
    service.addIncome({
      description: 'Freela',
      category: 'Freelance',
      amount: 900,
      date: '2026-02-12',
      recurring: false,
      active: true,
    });

    expect(service.getMonthBalance('2026-02').income).toBe(900);
    expect(service.getMonthBalance('2026-03').income).toBe(0);
  });

  it('adds cash and pix expenses directly to the purchase month', () => {
    service.addExpense({
      description: 'Mercado',
      category: 'Alimentação',
      amount: 300,
      date: '2026-02-10',
      paymentMethod: 'cash',
      installments: 1,
    });
    service.addExpense({
      description: 'Farmácia',
      category: 'Saúde',
      amount: 120,
      date: '2026-02-11',
      paymentMethod: 'pix',
      installments: 1,
    });

    const balance = service.getMonthBalance('2026-02');

    expect(balance.cashExpense).toBe(300);
    expect(balance.pixExpense).toBe(120);
    expect(balance.expense).toBe(420);
  });

  it('splits credit-card purchases across installment months with purchase date', () => {
    service.addCard({ name: 'Principal', limit: 3000, closingDay: 1, dueDay: 10 });
    const card = service.getState().cards[0];

    service.addExpense({
      description: 'Notebook',
      category: 'Educação',
      amount: 1200,
      date: '2026-01-20',
      paymentMethod: 'credit-card',
      cardId: card.id,
      installments: 3,
    });

    const invoice = service.getCardInvoice(card.id, '2026-02');

    expect(service.getCardInvoiceTotal(card.id, '2026-01')).toBe(400);
    expect(service.getCardInvoiceTotal(card.id, '2026-02')).toBe(400);
    expect(service.getCardInvoiceTotal(card.id, '2026-03')).toBe(400);
    expect(invoice[0].purchaseDate).toBe('2026-01-20');
  });

  it('updates cards, expenses and incomes', () => {
    service.addIncome({
      description: 'Salário',
      category: 'Salário',
      amount: 3000,
      date: '2026-01-05',
      recurring: true,
      active: true,
    });
    service.addExpense({
      description: 'Mercado',
      category: 'Alimentação',
      amount: 200,
      date: '2026-01-10',
      paymentMethod: 'pix',
      installments: 1,
    });
    service.addCard({ name: 'Principal', limit: 2000, closingDay: 1, dueDay: 10 });

    const income = service.getState().incomes[0];
    const expense = service.getState().expenses[0];
    const card = service.getState().cards[0];

    service.updateIncome(income.id, { ...income, amount: 3500 });
    service.updateExpense(expense.id, { ...expense, amount: 250 });
    service.updateCard(card.id, { name: 'Black', limit: 5000, closingDay: 2, dueDay: 12 });

    expect(service.getMonthBalance('2026-01').income).toBe(3500);
    expect(service.getMonthBalance('2026-01').pixExpense).toBe(250);
    expect(service.getState().cards[0].name).toBe('Black');
  });

  it('adds goal contributions and marks the goal as completed', () => {
    service.addGoal({
      name: 'Reserva',
      targetAmount: 1000,
      currentAmount: 0,
      deadline: '2026-12-31',
    });
    const goal = service.getState().goals[0];

    service.addGoalContribution(goal.id, { amount: 400, date: '2026-01-05' });
    service.addGoalContribution(goal.id, { amount: 600, date: '2026-02-05', notes: 'Bônus' });

    const updatedGoal = service.getState().goals[0];
    expect(updatedGoal.currentAmount).toBe(1000);
    expect(updatedGoal.completed).toBeTrue();
    expect(updatedGoal.contributions.length).toBe(2);
  });

  it('returns consolidated monthly launches', () => {
    service.addIncome({
      description: 'Freela',
      category: 'Freelance',
      amount: 900,
      date: '2026-02-12',
      recurring: false,
      active: true,
    });
    service.addExpense({
      description: 'Mercado',
      category: 'Alimentação',
      amount: 300,
      date: '2026-02-10',
      paymentMethod: 'pix',
      installments: 1,
    });

    const launches = service.getMonthlyLaunches('2026-02');

    expect(launches.length).toBe(2);
    expect(launches.some((launch) => launch.type === 'income')).toBeTrue();
    expect(launches.some((launch) => launch.type === 'expense')).toBeTrue();
  });

  it('stores accounts, income destination and investments', () => {
    service.addAccount({
      bankName: 'Banco Teste',
      accountName: 'Conta corrente',
      accountType: 'Conta corrente',
      initialBalance: 100,
    });
    const account = service.getState().accounts[0];

    service.addIncome({
      description: 'Salário',
      category: 'Salário',
      amount: 5000,
      date: '2026-03-05',
      recurring: true,
      active: true,
      accountId: account.id,
    });
    service.addInvestment({
      name: 'CDB liquidez diária',
      type: 'CDB',
      institution: 'Banco Teste',
      accountId: account.id,
      investedAmount: 1000,
      currentAmount: 1025,
      startDate: '2026-03-10',
    });

    expect(service.getState().incomes[0].accountId).toBe(account.id);
    expect(service.getAccountLabel(account.id)).toContain('Banco Teste');
    expect(service.getInvestmentsTotal()).toBe(1025);
    expect(service.getAccountsInitialTotal()).toBe(100);
  });

  it('stores the account used for goal reserve contributions', () => {
    service.addAccount({
      bankName: 'Banco Reserva',
      accountName: 'Reserva',
      accountType: 'Conta poupança',
      initialBalance: 0,
    });
    const account = service.getState().accounts[0];

    service.addGoal({
      name: 'Reserva',
      targetAmount: 1000,
      currentAmount: 0,
      deadline: '2026-12-31',
      accountId: account.id,
    });
    const goal = service.getState().goals[0];

    service.addGoalContribution(goal.id, {
      amount: 500,
      date: '2026-04-01',
      accountId: account.id,
    });

    expect(service.getState().goals[0].accountId).toBe(account.id);
    expect(service.getState().goals[0].contributions[0].accountId).toBe(account.id);
  });

  it('deletes incomes, expenses and investments when there are no blocking dependencies', () => {
    service.addIncome({
      description: 'Freela',
      category: 'Freelance',
      amount: 900,
      date: '2026-02-12',
      recurring: false,
      active: true,
    });
    service.addExpense({
      description: 'Mercado',
      category: 'Outros',
      amount: 300,
      date: '2026-02-10',
      paymentMethod: 'pix',
      installments: 1,
    });
    service.addInvestment({
      name: 'Tesouro Selic',
      type: 'CDB',
      institution: 'Corretora Teste',
      investedAmount: 1000,
      currentAmount: 1015,
      startDate: '2026-02-01',
    });

    const state = service.getState();

    expect(service.deleteIncome(state.incomes[0].id).success).toBeTrue();
    expect(service.deleteExpense(state.expenses[0].id).success).toBeTrue();
    expect(service.deleteInvestment(state.investments[0].id).success).toBeTrue();

    expect(service.getState().incomes.length).toBe(0);
    expect(service.getState().expenses.length).toBe(0);
    expect(service.getState().investments.length).toBe(0);
  });

  it('blocks account deletion when the account is linked to financial records', () => {
    service.addAccount({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 0,
    });
    const account = service.getState().accounts[0];

    service.addIncome({
      description: 'SalÃ¡rio',
      category: 'Pagamento',
      amount: 5000,
      date: '2026-03-05',
      recurring: true,
      active: true,
      accountId: account.id,
    });

    const result = service.deleteAccount(account.id);

    expect(result.success).toBeFalse();
    expect(service.getState().accounts.length).toBe(1);
  });

  it('blocks account deletion when the account has linked expenses', () => {
    service.addAccount({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 0,
    });
    const account = service.getState().accounts[0];

    service.addExpense({
      description: 'Mercado',
      category: 'Outros',
      amount: 200,
      date: '2026-03-10',
      paymentMethod: 'pix',
      accountId: account.id,
      installments: 1,
    });

    const result = service.deleteAccount(account.id);

    expect(result.success).toBeFalse();
    expect(service.getState().accounts.length).toBe(1);
  });

  it('blocks card deletion when the card has linked purchases', () => {
    service.addCard({ name: 'Principal', limit: 3000, closingDay: 1, dueDay: 10 });
    const card = service.getState().cards[0];

    service.addExpense({
      description: 'Notebook',
      category: 'Outros',
      amount: 1200,
      date: '2026-01-20',
      paymentMethod: 'credit-card',
      cardId: card.id,
      installments: 3,
    });

    const result = service.deleteCard(card.id);

    expect(result.success).toBeFalse();
    expect(service.getState().cards.length).toBe(1);
  });

  it('requires goal contributions to be deleted before deleting the goal', () => {
    service.addGoal({
      name: 'Reserva',
      targetAmount: 1000,
      currentAmount: 0,
      deadline: '2026-12-31',
    });
    const goal = service.getState().goals[0];
    service.addGoalContribution(goal.id, { amount: 400, date: '2026-01-05' });

    expect(service.deleteGoal(goal.id).success).toBeFalse();

    const contribution = service.getState().goals[0].contributions[0];
    expect(service.deleteGoalContribution(goal.id, contribution.id).success).toBeTrue();
    expect(service.getState().goals[0].currentAmount).toBe(0);
    expect(service.deleteGoal(goal.id).success).toBeTrue();
    expect(service.getState().goals.length).toBe(0);
  });

  it('calculates account balance and net worth by reference month', () => {
    service.addAccount({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 100,
    });
    const account = service.getState().accounts[0];

    service.addIncome({
      description: 'Pagamento mensal',
      category: 'Pagamento',
      amount: 1000,
      date: '2026-01-05',
      recurring: true,
      active: true,
      accountId: account.id,
    });
    service.addIncome({
      description: 'Freela',
      category: 'Freelance',
      amount: 500,
      date: '2026-02-12',
      recurring: false,
      active: true,
      accountId: account.id,
    });
    service.addGoal({
      name: 'Reserva',
      targetAmount: 1000,
      currentAmount: 0,
      deadline: '2026-12-31',
    });
    const goal = service.getState().goals[0];
    service.addGoalContribution(goal.id, { amount: 400, date: '2026-02-20', accountId: account.id });
    service.addExpense({
      description: 'Mercado',
      category: 'Outros',
      amount: 200,
      date: '2026-03-10',
      paymentMethod: 'pix',
      accountId: account.id,
      installments: 1,
    });
    service.addInvestment({
      name: 'CDB',
      type: 'CDB',
      institution: 'Banco Teste',
      accountId: account.id,
      investedAmount: 1000,
      currentAmount: 1000,
      startDate: '2026-03-01',
    });

    const accountSummary = service.getAccountSummary(account.id, '2026-03');
    const netWorth = service.getNetWorthSummary('2026-03');

    expect(accountSummary?.incomeTotal).toBe(3500);
    expect(accountSummary?.expenseTotal).toBe(200);
    expect(accountSummary?.reservedTotal).toBe(400);
    expect(accountSummary?.investmentTotal).toBe(1000);
    expect(accountSummary?.estimatedBalance).toBe(2000);
    expect(netWorth.liquidBalance).toBe(2000);
    expect(netWorth.reservedTotal).toBe(400);
    expect(netWorth.investmentTotal).toBe(1000);
    expect(netWorth.netWorth).toBe(3400);
  });

  it('calculates investment gain and groups investments by type', () => {
    service.addInvestment({
      name: 'CDB banco',
      type: 'CDB',
      institution: 'Banco Teste',
      investedAmount: 1000,
      currentAmount: 1125,
      profitabilityRate: 110,
      indexer: 'CDI',
      liquidity: 'Diaria',
      startDate: '2026-01-01',
    });
    service.addInvestment({
      name: 'Reserva emergencia',
      type: 'Reserva',
      institution: 'Banco Teste',
      investedAmount: 500,
      currentAmount: 500,
      liquidity: 'Diaria',
      startDate: '2026-01-01',
    });

    const cdb = service.getState().investments.find((investment) => investment.type === 'CDB');
    const summary = service.getInvestmentSummary(cdb!);
    const groups = service.getInvestmentGroups();

    expect(summary.gain).toBe(125);
    expect(summary.gainPercent).toBe(12.5);
    expect(groups.length).toBe(2);
    expect(groups.find((group) => group.type === 'CDB')?.totalGain).toBe(125);
  });

  it('redeems investments to an account and keeps transferred net worth coherent', () => {
    service.addAccount({
      bankName: 'Banco Origem',
      accountName: 'Corretora',
      accountType: 'Corretora',
      initialBalance: 0,
    });
    service.addAccount({
      bankName: 'Banco Destino',
      accountName: 'Conta corrente',
      accountType: 'Conta corrente',
      initialBalance: 0,
    });
    const sourceAccount = service.getState().accounts.find((account) => account.bankName === 'Banco Origem')!;
    const destinationAccount = service.getState().accounts.find((account) => account.bankName === 'Banco Destino')!;

    service.addInvestment({
      name: 'CDB banco',
      type: 'CDB',
      institution: 'Banco Origem',
      accountId: sourceAccount.id,
      investedAmount: 1000,
      currentAmount: 1000,
      startDate: '2026-01-01',
    });
    const investment = service.getState().investments[0];

    const result = service.redeemInvestment({
      investmentId: investment.id,
      amount: 300,
      date: '2026-04-10',
      accountId: destinationAccount.id,
      notes: 'resgate parcial',
    });

    const state = service.getState();
    expect(result.success).toBeTrue();
    expect(state.investments[0].currentAmount).toBe(700);
    expect(state.investments[0].investedAmount).toBe(700);
    expect(state.incomes[0].accountId).toBe(destinationAccount.id);
    expect(state.expenses[0].accountId).toBe(sourceAccount.id);
    expect(service.getNetWorthSummary('2026-04').netWorth).toBe(0);
  });
});
