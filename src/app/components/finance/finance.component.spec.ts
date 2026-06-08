import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { FinanceComponent } from './finance.component';

describe('FinanceComponent', () => {
  let component: FinanceComponent;
  let fixture: ComponentFixture<FinanceComponent>;

  beforeEach(async () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getStoredUserName', 'logout']);
    const storage = jasmine.createSpyObj<BrowserStorageService>('BrowserStorageService', ['getItem', 'setItem']);

    auth.getStoredUserName.and.returnValue('User Test');
    storage.getItem.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [FinanceComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: BrowserStorageService, useValue: storage },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with dashboard as the first tab', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('dashboard');
  });

  it('switches tabs without losing the selected month', () => {
    component.selectedMonth = '2026-05';

    component.setTab('expenses');
    component.setTab('cards');

    expect(component.activeTab).toBe('cards');
    expect(component.selectedMonth).toBe('2026-05');
  });

  it('saves and edits an income', () => {
    component.incomeForm.patchValue({
      description: 'Salário',
      category: 'Salário',
      amount: 5000,
      date: '2026-01-05',
      recurring: true,
    });
    component.saveIncome();

    const income = component.state.incomes[0];
    component.editIncome(income);
    component.incomeForm.patchValue({ amount: 5500 });
    component.saveIncome();

    expect(component.state.incomes.length).toBe(1);
    expect(component.state.incomes[0].amount).toBe(5500);
    expect(component.editingIncomeId).toBe('');
  });

  it('requires a payment source and shows installments only for credit card sources', () => {
    component.accountForm.patchValue({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 250,
    });
    component.saveAccount();
    const account = component.state.accounts[0];

    component.cardForm.patchValue({ name: 'Principal', limit: 2000, closingDay: 1, dueDay: 10 });
    component.saveCard();
    const card = component.state.cards[0];

    component.expenseForm.patchValue({
      description: 'Mercado',
      amount: 200,
      paymentSource: `pix:${account.id}`,
      installments: 1,
    });
    component.onPaymentMethodChange();

    expect(component.expenseForm.valid).toBeTrue();
    expect(component.isCreditCardPayment()).toBeFalse();
    expect(component.expenseForm.get('accountId')?.value).toBe(account.id);

    component.expenseForm.patchValue({
      paymentSource: `card:${card.id}`,
      installments: 2,
    });
    component.onPaymentMethodChange();

    expect(component.expenseForm.valid).toBeTrue();
    expect(component.isCreditCardPayment()).toBeTrue();
    expect(component.expenseForm.get('cardId')?.value).toBe(card.id);
  });

  it('does not duplicate account or card names in payment source labels', () => {
    component.accountForm.patchValue({
      bankName: 'Nubank',
      accountName: 'Conta principal',
      accountType: 'Conta corrente',
      initialBalance: 250,
    });
    component.saveAccount();
    component.cardForm.patchValue({ name: 'Cartao Gold', limit: 2000, closingDay: 1, dueDay: 10 });
    component.saveCard();

    const labels = component.paymentSourceOptions().map((option) => option.label);

    expect(labels).toContain('Pix - Conta principal');
    expect(labels).toContain('Cartao Gold');
    expect(labels).not.toContain('Cartao - Cartao Gold');
  });

  it('does not duplicate account names in account option labels', () => {
    component.accountForm.patchValue({
      bankName: 'Nubank',
      accountName: 'Nubank Conta principal',
      accountType: 'Conta corrente',
      initialBalance: 250,
    });
    component.saveAccount();
    const account = component.state.accounts[0];

    expect(component.accountOptionLabel(account)).toBe('Nubank Conta principal');
    expect(component.accountLabel(account.id)).toBe('Nubank Conta principal');
  });

  it('saves and edits cards and expenses', () => {
    component.cardForm.patchValue({ name: 'Principal', limit: 2000, closingDay: 1, dueDay: 10 });
    component.saveCard();
    const card = component.state.cards[0];

    component.editCard(card);
    component.cardForm.patchValue({ limit: 3000 });
    component.saveCard();

    component.expenseForm.patchValue({
      description: 'Notebook',
      category: 'Educação',
      amount: 1200,
      date: '2026-01-20',
      paymentSource: `card:${card.id}`,
      installments: 3,
    });
    component.onPaymentMethodChange();
    component.saveExpense();
    const expense = component.state.expenses[0];

    component.editExpense(expense);
    component.expenseForm.patchValue({ amount: 1500 });
    component.saveExpense();

    component.selectedMonth = '2026-01';
    expect(component.state.cards[0].limit).toBe(3000);
    expect(component.state.expenses[0].amount).toBe(1500);
    expect(component.cardInvoice(card.id)[0].purchaseDate).toBe('2026-01-20');
  });

  it('adds contributions to goals and marks completion', () => {
    component.goalForm.patchValue({
      name: 'Reserva',
      targetAmount: 1000,
      deadline: '2026-12-31',
    });
    component.saveGoal();
    const goal = component.state.goals[0];

    component.contributionForm.patchValue({ goalId: goal.id, amount: 1000, date: '2026-02-01' });
    component.addGoalContribution();

    expect(component.state.goals[0].currentAmount).toBe(1000);
    expect(component.state.goals[0].completed).toBeTrue();
    expect(component.completedGoalsCount()).toBe(1);
  });

  it('saves accounts and investments', () => {
    component.accountForm.patchValue({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 250,
    });
    component.saveAccount();
    const account = component.state.accounts[0];

    component.investmentForm.patchValue({
      name: 'CDB liquidez diária',
      type: 'CDB',
      institution: 'Banco Teste',
      accountId: account.id,
      investedAmount: 1000,
      currentAmount: 1010,
      profitabilityRate: 110,
      indexer: 'CDI',
      liquidity: 'Diaria',
      startDate: '2026-03-01',
      maturityDate: '2028-03-01',
    });
    component.saveInvestment();

    expect(component.state.accounts.length).toBe(1);
    expect(component.state.investments.length).toBe(1);
    expect(component.investmentsTotal()).toBe(1010);
    expect(component.investmentGain(component.state.investments[0])).toBe(10);
    expect(component.investmentGainPercent(component.state.investments[0])).toBe(1);
    expect(component.investmentGroups()[0].type).toBe('CDB');
    expect(component.accountLabel(account.id)).toContain('Banco Teste');
  });

  it('redeems an investment to a selected account', () => {
    component.accountForm.patchValue({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 0,
    });
    component.saveAccount();
    const account = component.state.accounts[0];

    component.investmentForm.patchValue({
      name: 'CDB',
      type: 'CDB',
      institution: 'Banco Teste',
      accountId: account.id,
      investedAmount: 1000,
      currentAmount: 1000,
      startDate: '2026-03-01',
    });
    component.saveInvestment();
    const investment = component.state.investments[0];

    component.redemptionForm.patchValue({
      investmentId: investment.id,
      amount: 400,
      date: '2026-04-10',
      accountId: account.id,
      notes: 'resgate parcial',
    });
    component.redeemInvestment();

    expect(component.feedbackType).toBe('success');
    expect(component.state.investments[0].currentAmount).toBe(600);
    expect(component.state.investments[0].investedAmount).toBe(600);
    expect(component.redemptionForm.get('amount')?.value).toBe(0);
  });

  it('updates dashboard balance when the selected month changes', () => {
    component.incomeForm.patchValue({
      description: 'Freela',
      category: 'Freelance',
      amount: 1000,
      date: '2026-03-12',
      recurring: false,
    });
    component.saveIncome();

    component.selectedMonth = '2026-03';
    expect(component.monthlyBalance().income).toBe(1000);
    expect(component.monthlyLaunches().length).toBe(1);

    component.selectedMonth = '2026-04';
    expect(component.monthlyBalance().income).toBe(0);
  });

  it('deletes a launch only after confirmation and shows success feedback', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.incomeForm.patchValue({
      description: 'Freela',
      category: 'Freelance',
      amount: 1000,
      date: '2026-03-12',
      recurring: false,
    });
    component.saveIncome();
    const income = component.state.incomes[0];

    component.deleteIncome(income.id);

    expect(window.confirm).toHaveBeenCalled();
    expect(component.state.incomes.length).toBe(0);
    expect(component.feedbackType).toBe('success');
    expect(component.feedbackMessage).toContain('excluida');
  });

  it('keeps the record when deletion is not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.cardForm.patchValue({ name: 'Principal', limit: 2000, closingDay: 1, dueDay: 10 });
    component.saveCard();
    const card = component.state.cards[0];

    component.deleteCard(card.id);

    expect(component.state.cards.length).toBe(1);
    expect(component.feedbackMessage).toBe('');
  });

  it('shows error feedback when deleting a linked account is blocked', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.accountForm.patchValue({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 250,
    });
    component.saveAccount();
    const account = component.state.accounts[0];

    component.incomeForm.patchValue({
      description: 'SalÃ¡rio',
      category: 'Pagamento',
      amount: 5000,
      date: '2026-01-05',
      recurring: true,
      accountId: account.id,
    });
    component.saveIncome();

    component.deleteAccount(account.id);

    expect(component.state.accounts.length).toBe(1);
    expect(component.feedbackType).toBe('error');
    expect(component.feedbackMessage).toContain('vinculada');
  });

  it('shows account and net worth summaries for the selected month', () => {
    component.accountForm.patchValue({
      bankName: 'Banco Teste',
      accountName: 'Principal',
      accountType: 'Conta corrente',
      initialBalance: 100,
    });
    component.saveAccount();
    const account = component.state.accounts[0];

    component.incomeForm.patchValue({
      description: 'Pagamento mensal',
      category: 'Pagamento',
      amount: 1000,
      date: '2026-01-05',
      recurring: true,
      accountId: account.id,
    });
    component.saveIncome();

    component.expenseForm.patchValue({
      description: 'Mercado',
      category: 'Outros',
      amount: 200,
      date: '2026-03-10',
      paymentSource: `pix:${account.id}`,
      installments: 1,
    });
    component.onPaymentMethodChange();
    component.saveExpense();

    component.selectedMonth = '2026-03';

    expect(component.accountSummaries()[0].incomeTotal).toBe(3000);
    expect(component.accountSummaries()[0].expenseTotal).toBe(200);
    expect(component.accountBalance(account.id)).toBe(2900);
    expect(component.netWorthSummary().netWorth).toBe(2900);
  });
});
