import { Router, Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminActivities } from "./pages/AdminActivities";
import { AdminActivityEdit } from "./pages/AdminActivityEdit";
import { AdminContent } from "./pages/AdminContent";
import { AdminGallery } from "./pages/AdminGallery";
import { AdminGalleryEdit } from "./pages/AdminGalleryEdit";
import { AdminSocial } from "./pages/AdminSocial";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export function AdminApp() {
  return (
    <QueryClientProvider client={adminQueryClient}>
      <Router>
        <div dir="rtl" lang="ar">
          <Switch>
            <Route path="/admin/login" component={AdminLogin} />

            <Route path="/admin/activities/new">
              <ProtectedRoute>
                <AdminLayout>
                  <AdminActivityEdit mode="new" />
                </AdminLayout>
              </ProtectedRoute>
            </Route>

            <Route path="/admin/activities/:id">
              {(params) => (
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminActivityEdit
                      mode="edit"
                      id={parseInt(params.id ?? "0")}
                    />
                  </AdminLayout>
                </ProtectedRoute>
              )}
            </Route>

            <Route path="/admin/activities">
              <ProtectedRoute>
                <AdminLayout>
                  <AdminActivities />
                </AdminLayout>
              </ProtectedRoute>
            </Route>

            <Route path="/admin/gallery/:id">
              {(params) => (
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminGalleryEdit id={parseInt(params.id ?? "0")} />
                  </AdminLayout>
                </ProtectedRoute>
              )}
            </Route>

            <Route path="/admin/gallery">
              <ProtectedRoute>
                <AdminLayout>
                  <AdminGallery />
                </AdminLayout>
              </ProtectedRoute>
            </Route>

            <Route path="/admin/content">
              <ProtectedRoute>
                <AdminLayout>
                  <AdminContent />
                </AdminLayout>
              </ProtectedRoute>
            </Route>

            <Route path="/admin/social">
              <ProtectedRoute>
                <AdminLayout>
                  <AdminSocial />
                </AdminLayout>
              </ProtectedRoute>
            </Route>

            <Route>
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            </Route>
          </Switch>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
