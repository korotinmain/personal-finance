import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  whitelist = environment.access.whitelist;
  environmentLabel = environment.production ? 'Production' : 'Staging';

  constructor(public auth: AuthService, private router: Router) {}

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } finally {
      void this.router.navigateByUrl('/login');
    }
  }
}
