import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Schedule from "./Schedule";

import DataManager from "./DataManager";

import Employees from "./Employees";

import SalesProjections from "./SalesProjections";

import Performa from "./Performa";

import Settings from "./Settings";

import ScheduleBuilder from "./ScheduleBuilder";

import PublishedSchedules from "./PublishedSchedules";

import Analytics from "./Analytics";

import LaborAudit from "./LaborAudit";

import UserManagement from "./UserManagement";

import Saves from "./Saves";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Schedule: Schedule,
    
    DataManager: DataManager,
    
    Employees: Employees,
    
    SalesProjections: SalesProjections,
    
    Performa: Performa,
    
    Settings: Settings,
    
    ScheduleBuilder: ScheduleBuilder,
    
    PublishedSchedules: PublishedSchedules,
    
    Analytics: Analytics,
    
    LaborAudit: LaborAudit,
    
    UserManagement: UserManagement,
    
    Saves: Saves,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Schedule" element={<Schedule />} />
                
                <Route path="/DataManager" element={<DataManager />} />
                
                <Route path="/Employees" element={<Employees />} />
                
                <Route path="/SalesProjections" element={<SalesProjections />} />
                
                <Route path="/Performa" element={<Performa />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/ScheduleBuilder" element={<ScheduleBuilder />} />
                
                <Route path="/PublishedSchedules" element={<PublishedSchedules />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/LaborAudit" element={<LaborAudit />} />
                
                <Route path="/UserManagement" element={<UserManagement />} />
                
                <Route path="/Saves" element={<Saves />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}