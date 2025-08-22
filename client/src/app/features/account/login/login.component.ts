import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatCard, MatFormField, MatInput, MatButton, MatLabel, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  returnUrl = '/shop';

  constructor() {
    const url = this.activatedRoute.snapshot.queryParams['returnUrl'];
    if (url) this.returnUrl = url;
  }

  loginForm = this.fb.group({
    email: [''],
    password: ['']
  })

  ngOnInit() {
    document.body.classList.add('auth-page');
  }

  ngOnDestroy() {
    document.body.classList.remove('auth-page');
  }

  onSubmit() {
    this.accountService.login(this.loginForm.value).subscribe({
      next: () => {
        this.accountService.getUserInfo().subscribe(user => {
          if (user) {
            const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
            if (role === 'Admin') {
              this.router.navigateByUrl('/admin/dashboard');
            } else if (role === 'Vendor') {
              this.router.navigateByUrl('/vendor/dashboard');
            } else {
              this.router.navigateByUrl(this.returnUrl);
            }
          } else {
            this.router.navigateByUrl(this.returnUrl);
          }
        });
      }
    });
  }
}
