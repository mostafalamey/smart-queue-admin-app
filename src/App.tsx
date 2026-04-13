import { Authenticated, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { dataProvider } from "./providers/data";
import { authProvider } from "./providers/auth-provider";
import { accessControlProvider } from "./providers/access-control-provider";
import QueueControl from "./pages/queue-control";
import Analytics from "./pages/analytics";
import OrgMetadata from "./pages/organization/OrgMetadata";
import UserManagement from "./pages/organization/UserManagement";
import DepartmentsStructure from "./pages/organization/DepartmentsStructure";
import Mapping from "./pages/organization/Mapping";
import TransferReasons from "./pages/organization/TransferReasons";
import UserExperience from "./pages/UserExperience";
import LoginPage from "./pages/login";
import ChangePasswordPage from "./pages/login/change-password";
import Unauthorized from "./pages/Unauthorized";
import Welcome from "./pages/Welcome";
import { RequireAccess } from "./components/require-access";
import { ChartNoAxesCombined, ListStart, Network, Cast, Building, UsersRound, Users, ArrowLeftRight, Settings } from "lucide-react";
import { Layout } from "./components/refine-ui/layout/layout";
import { getStoredUser } from "./lib/stored-user";
import { Navigate } from "react-router";
import { SocketProvider } from "./hooks/use-socket";

/**
 * Route guard: redirects to /change-password if the current user
 * still has mustChangePassword=true. Placed inside the Authenticated
 * wrapper so we know a user exists.
 */
function RequirePasswordChanged({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              accessControlProvider={accessControlProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "3KD91G-bZUWZz-CJXydE",
                title: {
                  text: "Smart Queue",
                  icon: <img src="/logo.svg" alt="Smart Queue" className="w-7 h-7" />,
                },
              }}

              resources={[
                {
                  name: "queue-control",
                  list: "/queue-control",
                  meta: {
                    label: "Queue Control",
                    icon: <ListStart />,
                  },
                },
                {
                  name: "analytics",
                  list: "/analytics",
                  meta: {
                    label: "Analytics",
                    icon: <ChartNoAxesCombined />,
                  },
                },
                {
                  name: "organization",
                  meta: {
                    label: "Organization",
                    icon: <Building />,
                  },
                },
                {
                  name: "org-metadata",
                  list: "/organization/metadata",
                  meta: {
                    label: "Metadata",
                    icon: <Settings />,
                    parent: "organization",
                  },
                },
                {
                  name: "user-management",
                  list: "/organization/users",
                  meta: {
                    label: "User Management",
                    icon: <Users />,
                    parent: "organization",
                  },
                },
                {
                  name: "departments-structure",
                  list: "/organization/departments",
                  meta: {
                    label: "Departments",
                    icon: <Network />,
                    parent: "organization",
                  },
                },
                {
                  name: "mapping",
                  list: "/organization/mapping",
                  meta: {
                    label: "Mapping",
                    icon: <Cast />,
                    parent: "organization",
                  },
                },
                {
                  name: "transfer-reasons",
                  list: "/organization/transfer-reasons",
                  meta: {
                    label: "Transfer Reasons",
                    icon: <ArrowLeftRight />,
                    parent: "organization",
                  },
                },
                {
                  name: "user-experience",
                  list: "/user-experience",
                  meta: {
                    label: "User Experience",
                    icon: <UsersRound />,
                  },
                },
              ]}
            >
              <Routes>
                {/* Protected routes — require authentication + password changed */}
                <Route
                  element={
                    <Authenticated
                      key="authenticated-routes"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <RequirePasswordChanged>
                        <SocketProvider>
                          <Layout>
                            <Outlet />
                          </Layout>
                        </SocketProvider>
                      </RequirePasswordChanged>
                    </Authenticated>
                  }
                >
                  <Route path="/" element={<Welcome />} />
                  <Route path="/queue-control" element={<RequireAccess resource="queue-control"><QueueControl /></RequireAccess>} />
                  <Route path="/analytics" element={<RequireAccess resource="analytics"><Analytics /></RequireAccess>} />
                  <Route path="/organization/metadata" element={<RequireAccess resource="organization"><OrgMetadata /></RequireAccess>} />
                  <Route path="/organization/users" element={<RequireAccess resource="organization"><UserManagement /></RequireAccess>} />
                  <Route path="/organization/departments" element={<RequireAccess resource="organization"><DepartmentsStructure /></RequireAccess>} />
                  <Route path="/organization/mapping" element={<RequireAccess resource="organization"><Mapping /></RequireAccess>} />
                  <Route path="/organization/transfer-reasons" element={<RequireAccess resource="organization"><TransferReasons /></RequireAccess>} />
                  <Route path="/user-experience" element={<RequireAccess resource="user-experience"><UserExperience /></RequireAccess>} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                </Route>

                {/* Auth routes — only accessible when NOT authenticated */}
                <Route
                  element={
                    <Authenticated
                      key="auth-pages"
                      fallback={<Outlet />}
                    >
                      {/* If already authenticated, go to home */}
                      <CatchAllNavigate to="/" />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Change password — accessible when authenticated (forced flow) */}
                <Route
                  element={
                    <Authenticated
                      key="change-password"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <Outlet />
                    </Authenticated>
                  }
                >
                  <Route path="/change-password" element={<ChangePasswordPage />} />
                </Route>

                {/* Catch-all — redirect unmatched paths */}
                <Route path="*" element={<CatchAllNavigate to="/" />} />
              </Routes>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
