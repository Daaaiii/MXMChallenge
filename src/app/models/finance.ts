export type FinanceCategory =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Cartão'
  | 'Outros';

export type IncomeCategory = 'Salário' | 'Pagamento' | 'Reembolso' | 'Freelance' | 'Outros';

export type PaymentMethod = 'cash' | 'pix' | 'credit-card';

export type FinanceLaunchType = 'income' | 'expense' | 'card-installment';

export type InvestmentType = 'Reserva' | 'CDB' | 'Tesouro Direto' | 'Fundo' | 'Ações' | 'Outros';

export type InvestmentIndexer = 'CDI' | 'IPCA' | 'Prefixado' | 'Selic' | 'Outro';

export type InvestmentLiquidity = 'Diaria' | 'No vencimento' | 'Sem liquidez' | 'Outro';

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountType: 'Conta corrente' | 'Conta poupança' | 'Carteira' | 'Corretora' | 'Outros';
  initialBalance: number;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: IncomeCategory;
  recurring: boolean;
  active: boolean;
  accountId?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: FinanceCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  accountId?: string;
  cardId?: string;
  installments: number;
  notes?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  accountId?: string;
  notes?: string;
}

export interface FinanceGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  accountId?: string;
  contributions: GoalContribution[];
  completed: boolean;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  institution: string;
  accountId?: string;
  investedAmount: number;
  currentAmount: number;
  profitabilityRate?: number;
  indexer?: InvestmentIndexer;
  liquidity?: InvestmentLiquidity;
  startDate: string;
  maturityDate?: string;
  liquidityDate?: string;
  notes?: string;
}

export interface InvestmentSummary {
  investment: Investment;
  gain: number;
  gainPercent: number;
}

export interface InvestmentGroup {
  type: InvestmentType;
  totalInvested: number;
  totalCurrent: number;
  totalGain: number;
  items: InvestmentSummary[];
}

export interface InvestmentRedemptionRequest {
  investmentId: string;
  amount: number;
  date: string;
  accountId: string;
  notes?: string;
}

export interface MonthlyInstallment {
  expenseId: string;
  cardId: string;
  cardName: string;
  description: string;
  category: FinanceCategory;
  purchaseDate: string;
  month: string;
  installmentNumber: number;
  installments: number;
  amount: number;
}

export interface FinanceLaunch {
  id: string;
  type: FinanceLaunchType;
  description: string;
  category: string;
  date: string;
  paymentLabel: string;
  amount: number;
}

export interface MonthlySummary {
  month: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export interface MonthlyBalance {
  month: string;
  income: number;
  expense: number;
  cashExpense: number;
  pixExpense: number;
  creditCardExpense: number;
  balance: number;
}

export interface AccountBalanceSummary {
  account: BankAccount;
  incomeTotal: number;
  expenseTotal: number;
  reservedTotal: number;
  investmentTotal: number;
  estimatedBalance: number;
}

export interface NetWorthSummary {
  liquidBalance: number;
  reservedTotal: number;
  investmentTotal: number;
  netWorth: number;
}

export interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  cards: CreditCard[];
  goals: FinanceGoal[];
  accounts: BankAccount[];
  investments: Investment[];
}

export interface FinanceDeleteResult {
  success: boolean;
  message: string;
}

export interface LegacyFinanceEntry {
  id: string;
  description: string;
  category: FinanceCategory;
  amount: number;
  date: string;
  type: 'expense' | 'bill' | 'card-purchase';
  accountId?: string;
  cardId?: string;
  installments?: number;
}
