import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Apartment, Location, Booking, GuestArchive } from '@/types';

export function useLocations(refreshKey: number = 0) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('display_order')
        .order('name');
      if (!cancelled) {
        if (error) console.error('useLocations', error);
        setLocations(data ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return { locations, loading };
}

export function useApartments(refreshKey: number) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('apartments')
      .select('*, location:locations(*), current_booking:bookings!current_booking_id(*)')
      .order('display_order', { ascending: true });
    if (error) console.error('useApartments', error);
    setApartments((data ?? []) as Apartment[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshKey]);

  return { apartments, loading, refetch: fetch };
}

export function useBookings(refreshKey: number) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, apartment:apartments(*)')
      .order('check_in', { ascending: false });
    if (error) console.error('useBookings', error);
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshKey]);

  return { bookings, loading, refetch: fetch };
}

export function useGuestArchive(refreshKey: number) {
  const [archive, setArchive] = useState<GuestArchive[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('guests_archive')
      .select('*')
      .order('archived_at', { ascending: false });
    if (error) console.error('useGuestArchive', error);
    setArchive(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch, refreshKey]);

  return { archive, loading, refetch: fetch };
}
