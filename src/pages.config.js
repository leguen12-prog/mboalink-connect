import Alerts from './pages/Alerts';
import Billing from './pages/Billing';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import NetworkMap from './pages/NetworkMap';
import NetworkMonitoring from './pages/NetworkMonitoring';
import OLTManagement from './pages/OLTManagement';
import ONTManagement from './pages/ONTManagement';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import ServicePlans from './pages/ServicePlans';
import Settings from './pages/Settings';
import Tickets from './pages/Tickets';
import WorkOrders from './pages/WorkOrders';
import TechnicianApp from './pages/TechnicianApp';
import GISDashboard from './pages/GISDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Alerts": Alerts,
    "Billing": Billing,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "Inventory": Inventory,
    "NetworkMap": NetworkMap,
    "NetworkMonitoring": NetworkMonitoring,
    "OLTManagement": OLTManagement,
    "ONTManagement": ONTManagement,
    "PredictiveMaintenance": PredictiveMaintenance,
    "ServicePlans": ServicePlans,
    "Settings": Settings,
    "Tickets": Tickets,
    "WorkOrders": WorkOrders,
    "TechnicianApp": TechnicianApp,
    "GISDashboard": GISDashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};