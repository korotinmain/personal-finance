import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, authState, signInWithPopup, signOut } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$: Observable<import('@angular/fire/auth').User | null> = authState(this.auth);

  constructor(private auth: Auth) {}

  signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider).then(() => undefined);
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }
}
