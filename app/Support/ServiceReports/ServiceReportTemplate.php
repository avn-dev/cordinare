<?php

namespace App\Support\ServiceReports;

class ServiceReportTemplate
{
    public static function defaultPayload(): array
    {
        return [
            'title' => 'Leistungsverzeichnis',
            'schedule_note' => 'Uhrzeit: nach Schließzeiten',
            'plan_rows' => [],
            'sections' => [
                [
                    'title' => 'Raumart: Verwaltungsbereiche, Büros, Besprechungsräume und Flure',
                    'tasks' => [
                        self::task('Papierbehälter leeren', '1 x wöchentlich'),
                        self::task('Behälter mit Müllbeutel bestücken', '1 x wöchentlich'),
                        self::task('Tische und Ablagen (soweit frei) feucht reinigen', '1 x wöchentlich'),
                        self::task('Fensterbänke feucht reinigen', '1 x wöchentlich'),
                        self::task('Kopier- und Faxgeräte, Telefon, wie auch Tischlampen feucht reinigen', '1 x wöchentlich'),
                        self::task('Griffspuren entfernen', '1 x wöchentlich'),
                        self::task('Abräumen von Geschirr in Besprechungsräumen und einräumen in Geschirrspülmaschine', 'nach Bedarf'),
                        self::task('Stühle feucht reinigen bzw. absaugen', '1 x monatlich'),
                        self::task('Waagerechte Flächen bis 1,80 m feucht reinigen', '1 x monatlich'),
                        self::task('Senkrechte Flächen bis 1,80 m feucht reinigen', '1 x monatlich'),
                        self::task('Spinnweben (bis 3,50 m Höhe) entfernen', 'nach Bedarf'),
                        self::task('Lichtschalter feucht reinigen', 'nach Bedarf'),
                    ],
                ],
                [
                    'title' => 'Raumart: Sanitäre Anlagen',
                    'tasks' => [
                        self::task('Abfallbehälter leeren', '1 x wöchentlich'),
                        self::task('Abfallbehälter mit Müllbeutel bestücken', '1 x wöchentlich'),
                        self::task('Abfallbehälter innen und außen feucht reinigen', 'nach Bedarf'),
                        self::task('Waschbecken einschl. Armaturen reinigen', '1 x wöchentlich'),
                        self::task('Ablagen feucht reinigen', '1 x wöchentlich'),
                        self::task('Spiegel reinigen und nachtrocknen', '1 x wöchentlich'),
                        self::task('Urinale bzw. WC-Becken einschl. Sitzfläche und Deckel desinfizierend reinigen und nachtrocknen', '1 x wöchentlich'),
                        self::task('Toilettenbürstenhalter nass reinigen', 'nach Bedarf'),
                        self::task('Wandfliesen/Trennwände im Spritzbereich reinigen', '1 x wöchentlich'),
                        self::task('Wandfliesen/Trennwände komplett reinigen', 'nach Bedarf'),
                        self::task('Griffspuren an Türen, sonstigen Elementen entfernen', '1 x wöchentlich'),
                        self::task('Fensterbänke feucht reinigen', '1 x wöchentlich'),
                        self::task('Türen einschl. Türrahmen komplett feucht reinigen', 'nach Bedarf'),
                        self::task('Spinnweben (bis 3,50 m Höhe) entfernen', 'nach Bedarf'),
                        self::task('Heizkörper (soweit frei) feucht reinigen', '2 x jährlich'),
                        self::task('Stoffhandtuchrollen austauschen', 'bei Bedarf'),
                        self::task('Handtuchpapier und Toilettenpapier nachlegen', 'bei Bedarf'),
                        self::task('Seifenspender auffüllen', 'bei Bedarf'),
                    ],
                ],
                [
                    'title' => 'Raumart: Küche/ Sozialraum/ Personalraum',
                    'tasks' => [
                        self::task('Abfall- und Papierbehälter leeren', '1 x wöchentlich'),
                        self::task('Behälter mit Müllbeutel bestücken', '1 x wöchentlich'),
                        self::task('Tische und Ablagen abräumen und feucht reinigen', '1 x wöchentlich'),
                        self::task('Spüle einschließlich Armaturen reinigen', '1 x wöchentlich'),
                        self::task('Schmutziges Geschirr in Spülmaschine einräumen', 'nach Bedarf'),
                        self::task('Spülmaschine einschalten', 'nach Bedarf'),
                        self::task('Sauberes Geschirr aus Spülmaschine nehmen und in die entsprechenden Schränke einräumen', 'nach Bedarf'),
                        self::task('Geschirr von Hand spülen und in die entsprechenden Schränke einräumen', 'nach Bedarf'),
                        self::task('Kaffeemaschine gemäß Kundenvorgabe reinigen', 'nach Bedarf'),
                        self::task('Wandfliesen im Spritzbereich reinigen', '1 x wöchentlich'),
                        self::task('Griffspuren an Türen/Schränken/Inventar entfernen', 'nach Bedarf'),
                        self::task('Aschenbecher leeren und feucht ausreiben', 'nach Bedarf'),
                        self::task('Waagerechte Flächen bis 1,80 m feucht reinigen', '1 x monatlich'),
                        self::task('Senkrechte Flächen bis 1,80 m feucht reinigen', '1 x monatlich'),
                        self::task('Stühle feucht reinigen bzw. absaugen', 'nach Bedarf'),
                        self::task('Tisch- und Stuhlgestelle feucht reinigen', 'nach Bedarf'),
                        self::task('Lichtschalter feucht reinigen', 'nach Bedarf'),
                        self::task('Türen einschl. Türrahmen komplett feucht wischen', '1 x monatlich'),
                        self::task('Heizkörper (soweit frei) feucht reinigen', '2 x jährlich'),
                        self::task('Spinnweben (bis 3,50 m Höhe) entfernen', 'nach Bedarf'),
                    ],
                ],
                [
                    'title' => 'Raumart: Internes Treppenhaus',
                    'tasks' => [
                        self::task('Handlauf und Treppengeländer feucht reinigen', '1 x wöchentlich'),
                        self::task('Türen einschl. Türrahmen komplett feucht reinigen', '1 x wöchentlich'),
                        self::task('Spinnweben (bis 3,50 m Höhe) entfernen', 'nach Bedarf'),
                        self::task('Lichtschalter feucht reinigen', 'nach Bedarf'),
                    ],
                ],
            ],
        ];
    }

    private static function task(string $label, string $frequency): array
    {
        return [
            'label' => $label,
            'frequency' => $frequency,
            'days' => self::emptyDays(),
            'week' => '',
        ];
    }

    private static function emptyDays(): array
    {
        return [
            'mo' => false,
            'di' => false,
            'mi' => false,
            'do' => false,
            'fr' => false,
            'sa' => false,
            'so' => false,
        ];
    }
}
