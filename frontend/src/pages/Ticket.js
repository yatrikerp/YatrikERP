import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { apiFetch } from '../utils/api';
import { useTripPositions } from '../lib/socket';

const Ticket = () => {
  const { pnr: pnrParam } = useParams();
  const [params] = useSearchParams();
  const pnr = pnrParam || params.get('pnr');
  const [ticket, setTicket] = useState(null);
  const [eta, setEta] = useState(null);
  const tripId = ticket?.tripId || null;
  const pos = useTripPositions(tripId);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!pnr) return;
      // Phase-0: assume an endpoint could return ticket by pnr in future; here we mock
      // setTicket({ pnr, tripId: 'realTrip', qrPayload: `YatrikERP|PNR:${pnr}`, expiresAt: new Date(Date.now()+3600000).toISOString() });
    }
    load();
    return () => { mounted = false; };
  }, [pnr]);

  useEffect(() => {
    let timer;
    async function refreshEta() {
      if (!tripId || !ticket?.stopId) return;
      const res = await apiFetch(`/api/eta?tripId=${tripId}&stopId=${ticket.stopId}`);
      if (res.ok) setEta(res.data);
    }
    refreshEta();
    timer = setInterval(refreshEta, 20000);
    return () => clearInterval(timer);
  }, [tripId, ticket?.stopId]);

  const liveDot = useMemo(() => (
    <span className="inline-flex items-center"><span className={`h-2 w-2 rounded-full ${pos ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} /></span>
  ), [pos]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ticket</h1>
      <div className="bg-white rounded-lg shadow p-5">
        {pnr ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">PNR</p>
              <p className="text-xl font-semibold">{pnr}</p>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">Live position {liveDot}</div>
              {eta && <p className="mt-2 text-sm text-gray-600">ETA: {eta.etaMinutes} min</p>}
            </div>
            <div className="shrink-0">
              <QRCode value={`GoBus|PNR:${pnr}`} size={140} includeMargin={false} />
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No PNR provided.</p>
        )}
      </div>
    </div>
  );
};

export default Ticket;
