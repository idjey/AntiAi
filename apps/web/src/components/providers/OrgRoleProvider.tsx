'use client';

import React, { createContext, useContext } from 'react';

type OrgRole = 'OWNER' | 'ADMIN' | 'CREATOR';

interface OrgRoleContextType {
    role: OrgRole | null;
    organizationId: string | null;
}

const OrgRoleContext = createContext<OrgRoleContextType>({ role: null, organizationId: null });

export function OrgRoleProvider({ 
    children, 
    role, 
    organizationId 
}: { 
    children: React.ReactNode;
    role: OrgRole | null;
    organizationId: string | null;
}) {
    return (
        <OrgRoleContext.Provider value={{ role, organizationId }}>
            {children}
        </OrgRoleContext.Provider>
    );
}

export function useOrgRole() {
    const context = useContext(OrgRoleContext);
    if (context === undefined) {
        throw new Error('useOrgRole must be used within an OrgRoleProvider');
    }
    return context;
}
