import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Schedule from "./Schedule";

import Documentation from "./Documentation";

import Import from "./Import";

import ScanConfiguration from "./ScanConfiguration";

import Container from "./Container";

import GravitonCompatibility from "./GravitonCompatibility";

import SystemsOverview from "./SystemsOverview";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Schedule: Schedule,
    
    Documentation: Documentation,
    
    Import: Import,
    
    ScanConfiguration: ScanConfiguration,
    
    Container: Container,
    
    GravitonCompatibility: GravitonCompatibility,
    
    SystemsOverview: SystemsOverview,
    
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
                
                <Route path="/Documentation" element={<Documentation />} />
                
                <Route path="/Import" element={<Import />} />
                
                <Route path="/ScanConfiguration" element={<ScanConfiguration />} />
                
                <Route path="/Container" element={<Container />} />
                
                <Route path="/GravitonCompatibility" element={<GravitonCompatibility />} />
                
                <Route path="/SystemsOverview" element={<SystemsOverview />} />
                
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