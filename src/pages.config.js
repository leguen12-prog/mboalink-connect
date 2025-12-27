import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import OLTManagement from './pages/OLTManagement';
import ONTManagement from './pages/ONTManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Customers": Customers,
    "OLTManagement": OLTManagement,
    "ONTManagement": ONTManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};