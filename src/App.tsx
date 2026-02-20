import { GitHubBanner, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";

import { BrowserRouter, Meta, Outlet, Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { dataProvider } from "./providers/data";
import QueueControle from "./pages/QueueControle";
import Analytics from "./pages/Analytics";
import DepartmentsStructure from "./pages/DepartmentsStructure";
import Mapping from "./pages/Mapping";
import Organization from "./pages/organization";
import UserExperience from "./pages/UserExperience";
import { ChartNoAxesCombined, ListStart, Network, Cast, Building, UsersRound } from "lucide-react";
import { Layout } from "./components/refine-ui/layout/layout";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "3KD91G-bZUWZz-CJXydE",
              }}

              resources={[
                {name: "queue-controle",
                  list: "/",
                  meta: {label: "Queue Controle",
                    icon: <ListStart />,
                  }
                },
                {
                  name: "analytics",
                  list: "/analytics",
                  meta: {label: "Analytics",
                    icon: <ChartNoAxesCombined />,
                  }
                },
                  {name: "departments-structure",
                    list: "/departments-structure",
                    meta: {label: "Departments Structure",
                      icon: <Network />,
                    }
                  },
                  {name: "mapping",
                    list: "/mapping",
                    meta: {label: "Mapping",
                      icon: <Cast />,
                    }
                  },
                  {name: "organization",
                    list: "/organization",
                    meta: {label: "Organization",
                      icon: <Building />,
                    }
                  },
                  {name: "user-experience",
                    list: "/user-experience",
                    meta: {label: "User Experience",
                      icon: <UsersRound />,
                    }
                  },
              ]}
            >
              <Routes>
                <Route element={
                  <Layout>
                    <Outlet /> {/* This will render the matched child route component */} 
                  </Layout>
                }>
                  <Route path="/" element={<QueueControle />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/departments-structure" element={<DepartmentsStructure />} />
                  <Route path="/mapping" element={<Mapping />} />
                  <Route path="/organization" element={<Organization />} />
                  <Route path="/user-experience" element={<UserExperience />} />
                </Route>
              </Routes>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
