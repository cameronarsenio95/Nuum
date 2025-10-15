# OpenAI API Setup voor NUUM

## Stap 1: OpenAI API Key aanmaken

1. Ga naar: https://platform.openai.com/api-keys
2. Log in met je OpenAI account (of maak een nieuw account aan)
3. Klik op **"Create new secret key"**
4. Geef je key een naam: `NUUM Support AI`
5. Kopieer de key meteen (je kunt hem later niet meer zien!)
6. Bewaar de key tijdelijk ergens veilig

**Voorbeeld key ziet er zo uit:**
```
sk-proj-abcdefghijklmnopqrstuvwxyz1234567890...
```

## Stap 2: Credits toevoegen aan OpenAI account

1. Ga naar: https://platform.openai.com/account/billing/overview
2. Klik op **"Add payment method"**
3. Voeg je creditcard toe
4. Klik op **"Add to credit balance"**
5. Voeg minimaal **$5-10** toe (dit is genoeg voor duizenden AI-antwoorden)

**Kosten verwachting:**
- GPT-4o-mini: ~$0.0001 per antwoord
- $10 = ongeveer 100,000 support antwoorden
- Super voordelig!

## Stap 3: OpenAI Key toevoegen aan Supabase

### Optie A: Via Supabase Dashboard (Aanbevolen)

1. Ga naar je Supabase project: https://supabase.com/dashboard
2. Selecteer je NUUM project
3. Klik in de linker sidebar op **"Edge Functions"**
4. Klik op **"Manage secrets"** (of **"Secrets"** tab)
5. Klik op **"New secret"**
6. Vul in:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Plak je OpenAI key (sk-proj-...)
7. Klik op **"Save"**

**Belangrijk:** De naam MOET exact `OPENAI_API_KEY` zijn (hoofdletters!)

### Optie B: Via Supabase CLI (Alternatief)

Als je de Supabase CLI geïnstalleerd hebt:

```bash
# Login bij Supabase
supabase login

# Link je project
supabase link --project-ref [JE-PROJECT-REF]

# Voeg secret toe
supabase secrets set OPENAI_API_KEY=sk-proj-jouw-key-hier
```

## Stap 4: Verificatie

Na het toevoegen van de key:

1. De edge functions gebruiken automatisch de key
2. Test door een support ticket aan te maken
3. Je zou nu slimme AI-antwoorden moeten krijgen!

## Veelgestelde Vragen

**Q: Hoeveel kost het?**
A: GPT-4o-mini is super goedkoop:
- Input: $0.150 per 1M tokens (~750k woorden)
- Output: $0.600 per 1M tokens (~750k woorden)
- Gemiddeld: ~$0.0001 per support antwoord

**Q: Moet ik een maandelijks abonnement?**
A: Nee! Je betaalt alleen voor wat je gebruikt (pay-as-you-go).

**Q: Kan ik een spending limit instellen?**
A: Ja! In OpenAI dashboard → Settings → Limits:
- Stel een maandelijkse limiet in (bijv. $20/maand)
- Je krijgt een email bij 75% en 100%

**Q: Is mijn key veilig?**
A: Ja! Supabase secrets zijn:
- Encrypted at rest
- Alleen toegankelijk voor je edge functions
- Niet zichtbaar in logs of API responses

**Q: Moet ik de edge functions opnieuw deployen?**
A: Nee! Ze gebruiken automatisch de nieuwe secret.

## Kosten Monitoring

Monitor je gebruik op:
- OpenAI Dashboard: https://platform.openai.com/usage
- Zie real-time kosten per API call
- Download detailed reports

## Support

Als je problemen hebt:
1. Check of de key naam exact `OPENAI_API_KEY` is
2. Verifieer dat de key begint met `sk-proj-`
3. Check OpenAI usage dashboard voor errors
4. Test met een support ticket in NUUM

## Wat gebeurt er zonder key?

Zonder OpenAI key gebruiken de edge functions een fallback response:
- Simpele, generieke antwoorden
- Geen context-aware AI
- Minder natuurlijke taal

Met OpenAI key:
- Slimme, context-aware antwoorden
- Natuurlijke conversaties
- Leert van je knowledge base
- Korte, informele replies (zoals je wilde!)
