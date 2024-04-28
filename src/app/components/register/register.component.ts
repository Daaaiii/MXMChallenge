import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Subscription } from 'rxjs';
import { passwordComplexityValidator } from '../../utils/validators/checkPassword';
import { cpfCnpjValidator } from '../../utils/validators/checkCPF_CNPJ';
import { cepValidator } from '../../utils/validators/checkCEP';
import { confirmPasswordValidator } from '../../utils/validators/checkConfirmPassword';
import { nameValidator } from '../../utils/validators/checkName';
import { phoneValidator } from '../../utils/validators/checkPhone';
import { FormService } from '../../services/form.service';
import { SearchCepService } from '../../services/search-cep.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective, NavbarComponent, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  providers:[provideNgxMask()]
})
export class RegisterComponent {
  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private cdr: ChangeDetectorRef,
    private cepService: SearchCepService,
    private router: Router,
    private authService: AuthService
  ) {}
  isLoading = false;
  page= 'Login';
  route= '/home';
  form!: FormGroup;
  errorMessage: string | null = '';
  formSubscription: Subscription | undefined;
  public showPassword: boolean = false;
  public showPasswordConfirmation: boolean = false;
  searchAttempted: boolean = false;

  ddds: number[] = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35,
    37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
    65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88,
    89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
  ];

  ufs: string[] = [
    'AC',
    'AL',
    'AM',
    'AP',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MG',
    'MS',
    'MT',
    'PA',
    'PB',
    'PE',
    'PI',
    'PR',
    'RJ',
    'RN',
    'RO',
    'RR',
    'RS',
    'SC',
    'SE',
    'SP',
    'TO',
  ];
  @Output() formCompleted = new EventEmitter<void>();
  onSubmit() {
    
    if (this.form.valid) {
      this.isLoading = true;
      this.formCompleted.emit();
      this.authService.register(this.form.value).subscribe({
        next: () => {       
          this.router.navigate(['/register-success']);
        },
        error: (err) => {
          this.errorMessage = err.error.message || 'Erro ao cadastrar usuário. Por favor, tente novamente.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
      this.form.reset();
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
      this.isLoading = false;
    }
  }
  

  ngOnInit() {
   
    this.form = this.fb.group(
      {
        fullname: new FormControl('', [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
          nameValidator(),
        ]),
        ddd: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(2),
        ]),
        phoneNumber: new FormControl('', [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          phoneValidator(),
        ]),
        email: new FormControl('', [Validators.required, Validators.email]),
        cpf_cnpj: new FormControl('', [
          Validators.required,
          Validators.minLength(11),
          Validators.maxLength(14),
          cpfCnpjValidator(),
        ]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(32),
          passwordComplexityValidator(),
        ]),
        confirmPassword: new FormControl('', [Validators.required]),
        zipcode: new FormControl('', [
          Validators.required,
          Validators.maxLength(10),
          Validators.minLength(8),
          cepValidator(),
        ]),
        state: new FormControl('', [
          Validators.required,
          Validators.maxLength(2),
          Validators.minLength(2),
        ]),
        city: new FormControl('', [Validators.required]),
        street: new FormControl('', [Validators.required]),
        complement: new FormControl(''),
        neighborhood: new FormControl('', [Validators.required]),
        number: new FormControl('', [Validators.required]),
      },
      { validators: [confirmPasswordValidator()] }
    );

    this.formSubscription = this.form.valueChanges.subscribe((values) => {
      this.formService.setFormData(values);
    });
    this.formService.getFormData().subscribe((data) => {
      if (data) {
        this.form.patchValue(data);
      }
    });
  }
  

  searchCEP() {
    this.searchAttempted = false;
    this.errorMessage = '';

    const cep = this.form.get('zipcode')?.value;
    if (cep && cep !== '') {
      this.searchAttempted = true;
      this.cepService.buscarCEP(cep).subscribe({
        next: (data) => {
          if (data.erro) {
            this.errorMessage = 'CEP não encontrado.';
          } else {
            this.form.patchValue({
              state: data.uf,
              city: data.localidade,
              street: data.logradouro,
              neighborhood: data.bairro,
            });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage =
            'Erro ao buscar o CEP. Por favor, tente novamente.';
          this.cdr.detectChanges();
        },
      });
    } else {
      this.errorMessage = 'Formato de CEP inválido.';
      this.searchAttempted = true;
    }
  }
}
