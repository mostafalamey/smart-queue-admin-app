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
import QueueControl from "./pages/QueueControl";
import Analytics from "./pages/Analytics";
import DepartmentsStructure from "./pages/DepartmentsStructure";
import Mapping from "./pages/Mapping";
import Organization from "./pages/Organization";
import UserExperience from "./pages/UserExperience";
import LoginPage from "./pages/login";
import ChangePasswordPage from "./pages/login/change-password";
import { ChartNoAxesCombined, ListStart, Network, Cast, Building, UsersRound } from "lucide-react";
import { Layout } from "./components/refine-ui/layout/layout";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
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
                  list: "/",
                  meta: {
                    label: "Queue Control",
                    icon: <ListStart />,
                  }
                },
                {
                  name: "analytics",
                  list: "/analytics",
                  meta: {
                    label: "Analytics",
                    icon: <ChartNoAxesCombined />,
                  }
                },
                  {
                    name: "departments-structure",
                    list: "/departments-structure",
                    meta: {
                      label: "Departments Structure",
                      icon: <Network />,
                    }
                  },
                  {
                    name: "mapping",
                    list: "/mapping",
                    meta: {
                      label: "Mapping",
                      icon: <Cast />,
                    }
                  },
                  {
                    name: "organization",
                    list: "/organization",
                    meta: {
                      label: "Organization",
                      icon: <Building />,
                    }
                  },
                  {
                    name: "user-experience",
                    list: "/user-experience",
                    meta: {
                      label: "User Experience",
                      icon: <UsersRound />,
                    }
                  },
              ]}
            >
              <Routes>
                {/* Protected routes — require authentication */}
                <Route
                  element={
                    <Authenticated
                      key="authenticated-routes"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <Layout>
                        <Outlet />
                      </Layout>
                    </Authenticated>
                  }
                >
                  <Route path="/" element={<QueueControl />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/departments-structure" element={<DepartmentsStructure />} />
                  <Route path="/mapping" element={<Mapping />} />
                  <Route path="/organization" element={<Organization />} />
                  <Route path="/user-experience" element={<UserExperience />} />
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
