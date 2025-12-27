import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import OLTManagement from './pages/OLTManagement';
import ONTManagement from './pages/ONTManagement';
import Tickets from './pages/Tickets';
import Billing from './pages/Billing';
import WorkOrders from './pages/WorkOrders';
import ServicePlans from './pages/ServicePlans';
import Inventory from './pages/Inventory';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import NetworkMonitoring from './pages/NetworkMonitoring';
import NetworkMap from './pages/NetworkMap';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import DashboardTranslated from './pages/DashboardTranslated';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Customers": Customers,
    "OLTManagement": OLTManagement,
    "ONTManagement": ONTManagement,
    "Tickets": Tickets,
    "Billing": Billing,
    "WorkOrders": WorkOrders,
    "ServicePlans": ServicePlans,
    "Inventory": Inventory,
    "Alerts": Alerts,
    "Settings": Settings,
    "NetworkMonitoring": NetworkMonitoring,
    "NetworkMap": NetworkMap,
    "PredictiveMaintenance": PredictiveMaintenance,
    "DashboardTranslated": DashboardTranslated,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};