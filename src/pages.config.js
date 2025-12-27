import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import OLTManagement from './pages/OLTManagement';
import ONTManagement from './pages/ONTManagement';
import Tickets from './pages/Tickets';
import Billing from './pages/Billing';
import WorkOrders from './pages/WorkOrders';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Customers": Customers,
    "OLTManagement": OLTManagement,
    "ONTManagement": ONTManagement,
    "Tickets": Tickets,
    "Billing": Billing,
    "WorkOrders": WorkOrders,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};