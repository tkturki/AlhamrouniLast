"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_router_dom_1 = require("react-router-dom");
var Layout_1 = require("./components/Layout");
var HomePage_1 = require("./pages/HomePage");
var AddItemPage_1 = require("./pages/AddItemPage");
var SalesPage_1 = require("./pages/SalesPage");
var InvoicePage_1 = require("./pages/InvoicePage");
var SearchPage_1 = require("./pages/SearchPage");
var ItemsPage_1 = require("./pages/ItemsPage");
var InvoicesPage_1 = require("./pages/InvoicesPage");
var LoginPage_1 = require("./pages/LoginPage");
var GalleryPage_1 = require("./pages/GalleryPage");
var AdminPanel_1 = require("./pages/AdminPanel");
var PrintLabelsPage_1 = require("./pages/PrintLabelsPage");
var DashboardPage_1 = require("./pages/DashboardPage");
var DraftInvoicesPage_1 = require("./pages/DraftInvoicesPage");
var SuppliersPage_1 = require("./pages/SuppliersPage");
var OrdersPage_1 = require("./pages/OrdersPage");
var TreasuryPage_1 = require("./pages/TreasuryPage");
var MobileDashboard_1 = require("./pages/MobileDashboard");
var supabase_1 = require("./services/supabase");
var react_1 = require("react");
// مكون الحماية
var ProtectedRoute = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(null), isAuthenticated = _b[0], setIsAuthenticated = _b[1];
    (0, react_1.useEffect)(function () {
        setIsAuthenticated(supabase_1.authApi.isAuthenticated());
    }, []);
    if (isAuthenticated === null) {
        return (<div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>);
    }
    if (!isAuthenticated) {
        return <react_router_dom_1.Navigate to="/login" replace/>;
    }
    return <>{children}</>;
};
// مكون للأدمن فقط
var AdminRoute = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(null), user = _b[0], setUser = _b[1];
    (0, react_1.useEffect)(function () {
        setUser(supabase_1.authApi.getCurrentUser());
    }, []);
    if (user === null) {
        return (<div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>);
    }
    if ((user === null || user === void 0 ? void 0 : user.role) !== 'admin') {
        return <react_router_dom_1.Navigate to="/" replace/>;
    }
    return <>{children}</>;
};
function App() {
    return (<react_router_dom_1.BrowserRouter>
      <react_router_dom_1.Routes>
        <react_router_dom_1.Route path="/login" element={<LoginPage_1.default />}/>
        <react_router_dom_1.Route path="/" element={<ProtectedRoute><Layout_1.default><HomePage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/add" element={<ProtectedRoute><Layout_1.default><AddItemPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/sales" element={<ProtectedRoute><Layout_1.default><SalesPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/invoice" element={<ProtectedRoute><Layout_1.default><InvoicePage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/search" element={<ProtectedRoute><Layout_1.default><SearchPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/items" element={<ProtectedRoute><Layout_1.default><ItemsPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/invoices" element={<ProtectedRoute><Layout_1.default><InvoicesPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/gallery" element={<ProtectedRoute><Layout_1.default><GalleryPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/admin" element={<AdminRoute><Layout_1.default><AdminPanel_1.default /></Layout_1.default></AdminRoute>}/>
        <react_router_dom_1.Route path="/print-labels" element={<ProtectedRoute><Layout_1.default><PrintLabelsPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/dashboard" element={<ProtectedRoute><Layout_1.default><DashboardPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/draft-invoices" element={<ProtectedRoute><Layout_1.default><DraftInvoicesPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/suppliers" element={<AdminRoute><Layout_1.default><SuppliersPage_1.default /></Layout_1.default></AdminRoute>}/>
        <react_router_dom_1.Route path="/orders" element={<ProtectedRoute><Layout_1.default><OrdersPage_1.default /></Layout_1.default></ProtectedRoute>}/>
        <react_router_dom_1.Route path="/treasury" element={<AdminRoute><Layout_1.default><TreasuryPage_1.default /></Layout_1.default></AdminRoute>}/>
        <react_router_dom_1.Route path="/mobile" element={<AdminRoute><MobileDashboard_1.default /></AdminRoute>}/>
      </react_router_dom_1.Routes>
    </react_router_dom_1.BrowserRouter>);
}
exports.default = App;
