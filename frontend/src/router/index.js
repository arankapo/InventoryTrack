import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("@/components/layout/AppShell.vue"),
    children: [
      { path: "", redirect: "/dashboard" },
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/views/DashboardView.vue"),
      },
      {
        path: "products",
        name: "products",
        component: () => import("@/views/ProductsView.vue"),
      },
      {
        path: "warehouses",
        name: "warehouses",
        component: () => import("@/views/WarehousesView.vue"),
        meta: { roles: ["ADMIN"] },
      },
      {
        path: "stock",
        name: "stock",
        component: () => import("@/views/StockView.vue"),
      },
      {
        path: "users",
        name: "users",
        component: () => import("@/views/UsersView.vue"),
        meta: { roles: ["ADMIN"] },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  if (to.meta.public) {
    if (to.name === "login" && auth.isAuthenticated) return next("/dashboard");
    return next();
  }

  if (!auth.isAuthenticated) {
    return next({ name: "login", query: { redirect: to.fullPath } });
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return next("/dashboard");
  }

  next();
});

export default router;
