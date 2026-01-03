import { NgModule } from "@angular/core";
import {
  LucideAngularModule,
  Home,
  Wallet,
  BarChart3,
  Target,
  Settings,
  Send,
  Download,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-angular";

@NgModule({
  imports: [
    LucideAngularModule.pick({
      Home,
      Wallet,
      BarChart3,
      Target,
      Settings,
      Send,
      Download,
      CreditCard,
      TrendingUp,
      ArrowUpRight,
      ArrowDownRight,
    }),
  ],
  exports: [LucideAngularModule],
})
export class LucideIconsModule {}
