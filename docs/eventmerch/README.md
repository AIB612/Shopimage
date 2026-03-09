# EventMerch Feature Branch

## 🎯 Ziel (Goal)

EventMerch als neue Feature-Linie in Shopimage integrieren:
- Wiederverwendung der Shopimage-Infrastruktur
- Neue Features für Event-Personalisierung
- Gemeinsame Code-Basis

## 📁 Struktur (Structure)

```
Shopimage/
├── client/
│   └── src/
│       ├── features/
│       │   ├── shopimage/      # Existing Shopimage features
│       │   └── eventmerch/     # New EventMerch features
│       │       ├── design-generator/
│       │       ├── photo-upload/
│       │       └── pod-shop/
├── server/
│   └── routes/
│       ├── shopimage/          # Existing routes
│       └── eventmerch/         # New EventMerch routes
└── docs/
    └── eventmerch/             # EventMerch documentation
```

## 🚀 Nächste Schritte (Next Steps)

1. EventMerch-Features in `client/src/features/eventmerch/` erstellen
2. EventMerch-Routes in `server/routes/eventmerch/` erstellen
3. Shared Components wiederverwenden
4. Neue Database Tables hinzufügen

## 📊 Status

- [x] Branch erstellt: `feature/eventmerch`
- [x] Dokumentation kopiert
- [ ] Features implementieren
- [ ] Testing
- [ ] Merge zu main

---

**Siehe auch:**
- [Product Core Goals](./product-core-goals.md)
- [User Journey](./swiss-mountain-wedding-journey.md)
- [P0 MVP Plan](./P0-MVP-Development-Plan.md)
