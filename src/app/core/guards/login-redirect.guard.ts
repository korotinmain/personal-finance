import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const loginRedirectGuard: CanActivateFn = (): ReturnType<CanActivateFn> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    map((user) => (user ? router.createUrlTree(['/app/dashboard']) : (true as UrlTree | boolean)))
  );
};
