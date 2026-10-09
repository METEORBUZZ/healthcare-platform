import React, { useState, useEffect } from 'react';
import type { DoctorDto, SlotDto, AppointmentType } from '@healthcare/shared';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

interface BookingModalProps {
  doctor: DoctorDto | null;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAuth: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  onClose,
  onSuccess,
  onOpenAuth,
}) => {
  const { user, meta } = useAuth();

  // Today's date in YYYY-MM-DD
  const todayStr = meta?.today || new Date().toISOString().split('T')[0]!;

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Consultation');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedSuccess, setBookedSuccess] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch slots whenever doctor or selectedDate changes
  useEffect(() => {
    if (!doctor || !selectedDate) return;
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setError(null);
        setSelectedTime(null);
        const data = await api.getSlots(doctor.id, selectedDate);
        setSlots(data.slots);
      } catch (err: unknown) {
        console.error('Failed to load slots', err);
        const message = err instanceof Error ? err.message : 'Could not fetch time slots for this date.';
        setError(message);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [doctor, selectedDate]);

  if (!doctor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (user.role !== 'PATIENT') {
      setError('Only registered patients can book appointments. Please switch to a Patient account.');
      return;
    }
    if (!selectedTime) {
      setError('Please select an available time slot.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the consultation.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.createAppointment({
        doctorId: doctor.id,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      setBookedSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to book appointment. Please try another slot.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '95%' }}
      >
        <div className="modal-header">
          <div>
            <h3 id="booking-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Book Appointment
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              with <strong style={{ color: 'var(--primary)' }}>{doctor.name}</strong> • {doctor.specialization}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {bookedSuccess ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Appointment Confirmed!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Your appointment with {doctor.name} is booked for {selectedDate} at {selectedTime}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Doctor Fee summary */}
              <div
                style={{
                  background: 'var(--bg-card-subtle)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Consultation Fee:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  ₹{doctor.consultationFee}
                </span>
              </div>

              {/* Patient Auth Banner */}
              {!user && (
                <div
                  style={{
                    background: 'var(--primary-light)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} color="var(--primary)" />
                    <span>Please sign in to your patient account to complete booking.</span>
                  </div>
                  {onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => onOpenAuth()}
                      className="btn btn-primary btn-sm"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              )}

              {user && user.role !== 'PATIENT' && (
                <div
                  style={{
                    background: 'var(--warning-bg)',
                    color: 'var(--warning)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>You are signed in as {user.role}. Booking appointments is reserved for patients.</span>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  style={{
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Date selection */}
              <div>
                <label
                  htmlFor="booking-date"
                  className="form-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Calendar size={15} color="var(--primary)" />
                  Select Date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  className="form-input"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>

              {/* Slot Grid */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} color="var(--primary)" />
                  Available Time Slots ({selectedDate})
                </label>
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Loading available consultation slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div
                    style={{
                      background: 'var(--bg-card-subtle)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    No consultation slots available for this day. The doctor may be off or booked out.
                  </div>
                ) : (
                  <div
                    role="group"
                    aria-label="Available consultation time slots"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                      gap: '0.5rem',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      padding: '0.25rem',
                    }}
                  >
                    {slots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          aria-pressed={isSelected}
                          aria-label={`Time slot ${slot.time}${slot.available ? ', available' : ', unavailable'}`}
                          style={{
                            padding: '0.5rem 0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: slot.available ? 'pointer' : 'not-allowed',
                            border: '1px solid',
                            borderColor: isSelected
                              ? 'var(--primary)'
                              : slot.available
                              ? 'var(--border)'
                              : 'transparent',
                            background: isSelected
                              ? 'var(--primary)'
                              : slot.available
                              ? 'var(--bg-card)'
                              : 'var(--bg-card-subtle)',
                            color: isSelected
                              ? 'white'
                              : slot.available
                              ? 'var(--text-primary)'
                              : 'var(--text-muted)',
                            opacity: slot.available ? 1 : 0.45,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Consultation Type & Reason */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <label htmlFor="booking-type" className="form-label">
                    Consultation Type
                  </label>
                  <select
                    id="booking-type"
                    className="form-select"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Routine Checkup">Routine Checkup</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="booking-reason" className="form-label">
                    Reason for Visit *
                  </label>
                  <input
                    id="booking-reason"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Chest pain, Skin rash..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label htmlFor="booking-notes" className="form-label">
                  Symptoms & Notes (Optional)
                </label>
                <textarea
                  id="booking-notes"
                  className="form-textarea"
                  rows={2}
                  placeholder="Share any background details or symptoms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(submitting || !selectedTime || (user && user.role !== 'PATIENT'))}
                className="btn btn-primary"
              >
                {submitting ? 'Confirming...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
