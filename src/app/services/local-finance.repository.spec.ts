import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BrowserStorageService } from './browser-storage.service';
import { LocalFinanceRepository } from './local-finance.repository';

describe('LocalFinanceRepository', () => {
  let repository: LocalFinanceRepository;
  let storage: jasmine.SpyObj<BrowserStorageService>;

  beforeEach(() => {
    storage = jasmine.createSpyObj<BrowserStorageService>('BrowserStorageService', ['getItem', 'setItem']);

    TestBed.configureTestingModule({
      providers: [LocalFinanceRepository, { provide: BrowserStorageService, useValue: storage }],
    });

    repository = TestBed.inject(LocalFinanceRepository);
  });

  it('returns an empty finance state when storage has no data', async () => {
    storage.getItem.and.returnValue(null);

    const state = await firstValueFrom(repository.load('FinanceState:User'));

    expect(state.incomes).toEqual([]);
    expect(state.expenses).toEqual([]);
    expect(state.cards).toEqual([]);
    expect(state.goals).toEqual([]);
    expect(state.accounts).toEqual([]);
    expect(state.investments).toEqual([]);
  });

  it('saves the finance state using the informed storage key', async () => {
    const state = {
      incomes: [],
      expenses: [],
      cards: [],
      goals: [],
      accounts: [],
      investments: [],
    };

    const savedState = await firstValueFrom(repository.save('FinanceState:User', state));

    expect(storage.setItem).toHaveBeenCalledWith('FinanceState:User', JSON.stringify(state));
    expect(savedState).toBe(state);
  });

  it('normalizes legacy entries into expenses', async () => {
    storage.getItem.and.returnValue(
      JSON.stringify({
        entries: [
          {
            id: 'legacy-1',
            description: 'Compra antiga',
            category: 'Outros',
            amount: 250,
            date: '2026-01-10',
            type: 'card-purchase',
            cardId: 'card-1',
            installments: 2,
          },
        ],
        cards: [{ id: 'card-1', name: 'Principal', limit: 1000, closingDay: 1, dueDay: 10 }],
      })
    );

    const state = await firstValueFrom(repository.load('FinanceState:User'));

    expect(state.expenses.length).toBe(1);
    expect(state.expenses[0].paymentMethod).toBe('credit-card');
    expect(state.expenses[0].cardId).toBe('card-1');
    expect(state.expenses[0].installments).toBe(2);
    expect(state.expenses[0].createdAt).toBe('2026-01-10T00:00:00.000Z');
    expect(state.expenses[0].updatedAt).toBe('2026-01-10T00:00:00.000Z');
    expect(state.expenses[0].version).toBe(1);
    expect(state.cards.length).toBe(1);
  });

  it('normalizes existing state with sync metadata', async () => {
    storage.getItem.and.returnValue(
      JSON.stringify({
        incomes: [
          {
            id: 'income-1',
            description: 'Pagamento',
            category: 'Pagamento',
            amount: 1000,
            date: '2026-02-05',
            recurring: false,
            active: true,
          },
        ],
        expenses: [],
        cards: [],
        goals: [
          {
            id: 'goal-1',
            name: 'Reserva',
            targetAmount: 1000,
            currentAmount: 100,
            deadline: '2026-12-31',
            contributions: [{ id: 'contribution-1', amount: 100, date: '2026-02-10' }],
          },
        ],
        accounts: [],
        investments: [],
      })
    );

    const state = await firstValueFrom(repository.load('FinanceState:User'));

    expect(state.incomes[0].createdAt).toBe('2026-02-05T00:00:00.000Z');
    expect(state.incomes[0].version).toBe(1);
    expect(state.goals[0].createdAt).toBe('2026-12-31T00:00:00.000Z');
    expect(state.goals[0].contributions[0].createdAt).toBe('2026-02-10T00:00:00.000Z');
    expect(state.goals[0].contributions[0].version).toBe(1);
  });
});
