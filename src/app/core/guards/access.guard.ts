import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

const allowedEmails = environment.access.whitelist.map((item) => item.toLowerCase());

export const accessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map((user) => {
      const email = user?.email?.toLowerCase() ?? '';
      if (email && allowedEmails.includes(email)) {
        return true;
      }
      if (user) {
        void authService.signOut();
      }
      return router.createUrlTree(['/login'], { queryParams: { blocked: '1' } });
    })
  );
};
