import { createBrowserRouter } from "react-router";

import { Layout } from "./pages/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { ProductForm } from "./pages/ProductForm";
import { Orders } from "./pages/Orders";
import { OrderDetails } from "./pages/OrderDetails";
import { Payments } from "./pages/Payments";
import { Profile } from "./pages/Profile";
import { Auth } from "./pages/Auth";
import { Settings } from "./pages/Settings";
import { VerificationInfo } from "./pages/VerificationInfo";
import { ActivityList } from "./pages/ActivityList";
import { ProductVerification } from "./pages/ProductVerification";
import { ReviewsAnalytics } from "./pages/ReviewsAnalytics";

export const router = createBrowserRouter([
  { path: "/auth", Component: Auth },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "products", Component: Products },
      { path: "orders", Component: Orders },
      { path: "payments", Component: Payments },
      { path: "profile", Component: Profile },
    ],
  },
  { path: "products/new", Component: ProductForm },
  { path: "products/:id/edit", Component: ProductForm },
  { path: "products/:id/verify", Component: ProductVerification },
  { path: "orders/:id", Component: OrderDetails },
  { path: "settings", Component: Settings },
  { path: "verification-info", Component: VerificationInfo },
  { path: "activity", Component: ActivityList },
  { path: "reviews-analytics", Component: ReviewsAnalytics },
]);
