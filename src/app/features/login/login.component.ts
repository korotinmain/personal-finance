import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  blocked = false;
  isLoading = false;

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router) {
    this.blocked = this.route.snapshot.queryParamMap.get('blocked') === '1';
  }

  async signIn(): Promise<void> {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      await this.auth.signInWithGoogle();
      void this.router.navigateByUrl('/app/dashboard');
    } finally {
      this.isLoading = false;
    }
  }
}
