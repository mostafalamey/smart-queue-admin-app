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
import QueueControle from "./pages/queue-controle";
import Analytics from "./pages/analytics";
import { ChartNoAxesCombined, ListStart } from "lucide-react"; // Import the list-start icon
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
                }
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
