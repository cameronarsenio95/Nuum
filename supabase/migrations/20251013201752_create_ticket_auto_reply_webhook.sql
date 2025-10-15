/*
  # Fix Ticket Auto-Reply System

  1. Changes
    - Remove problematic trigger that depends on runtime settings
    - Client-side will handle AI response triggering
    - Simpler and more reliable approach

  2. Notes
    - No dependency on database HTTP extensions
    - Client-side approach provides better error handling
    - Still provides automatic AI responses
*/

DROP TRIGGER IF EXISTS on_ticket_created ON support_tickets;
DROP FUNCTION IF EXISTS trigger_auto_reply_ticket();
