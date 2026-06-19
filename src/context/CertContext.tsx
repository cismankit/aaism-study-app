import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Certification } from '../data/certifications';
import { getCertification, DEFAULT_CERT_ID } from '../data/certifications';
import {
  getActiveCertId,
  setActiveCertId,
  getDefaultCertId,
  setDefaultCertId,
} from '../services/certContextService';

interface CertContextType {
  activeCertId: string;
  activeCert: Certification;
  setActiveCert: (certId: string) => void;
  defaultCertId: string;
  setDefaultCert: (certId: string) => void;
}

const CertContext = createContext<CertContextType | undefined>(undefined);

export function CertProvider({ children }: { children: ReactNode }) {
  const [activeCertId, setActiveCertIdState] = useState(() => getActiveCertId());
  const [defaultCertId, setDefaultCertIdState] = useState(() => getDefaultCertId());

  const activeCert = getCertification(activeCertId) ?? getCertification(DEFAULT_CERT_ID)!;

  useEffect(() => {
    setActiveCertId(activeCertId);
  }, [activeCertId]);

  const setActiveCert = useCallback((certId: string) => {
    setActiveCertId(certId);
    setActiveCertIdState(certId);
  }, []);

  const setDefaultCert = useCallback((certId: string) => {
    setDefaultCertId(certId);
    setDefaultCertIdState(certId);
    setActiveCert(certId);
  }, [setActiveCert]);

  return (
    <CertContext.Provider
      value={{
        activeCertId,
        activeCert,
        setActiveCert,
        defaultCertId,
        setDefaultCert,
      }}
    >
      {children}
    </CertContext.Provider>
  );
}

export function useCert() {
  const ctx = useContext(CertContext);
  if (!ctx) {
    throw new Error('useCert must be used within CertProvider');
  }
  return ctx;
}
