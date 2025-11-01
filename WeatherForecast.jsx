import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Wind } from 'lucide-react';

const getWeatherIcon = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('sunny') || desc.includes('clear')) return Sun;
    if (desc.includes('partly cloudy')) return CloudSun;
    if (desc.includes('cloudy') || desc.includes('overcast')) return Cloud;
    if (desc.includes('rain') || desc.includes('shower')) return CloudRain;
    if (desc.includes('thunderstorm')) return CloudLightning;
    if (desc.includes('snow')) return CloudSnow;
    if (desc.includes('fog') || desc.includes('mist')) return CloudFog;
    if (desc.includes('wind')) return Wind;
    return Cloud;
};

export default function WeatherForecast({ weather, isLoading, location, days, title }) {
    return (
        <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
            <CardHeader>
                <CardTitle className="blazin-text">{title}</CardTitle>
                {location && <p className="blazin-text-light text-sm">Forecast for {location}</p>}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {Array.from({ length: days }).map((_, i) => (
                            <Skeleton key={i} className="min-w-[100px] h-[120px]" style={{backgroundColor: '#EADED2'}} />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${days}, minmax(100px, 1fr))` }}>
                        {weather.slice(0, days).map((item, index) => {
                            const Icon = getWeatherIcon(item.description);
                            return (
                                <div key={index} className="flex flex-col items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-divider)'}}>
                                    <div className="font-semibold blazin-text">{format(parseISO(item.date), 'EEE')}</div>
                                    <Icon className="w-8 h-8" style={{ color: 'var(--text-charcoal)' }} />
                                    <div className="text-sm blazin-text text-center">
                                        <span className="font-bold">{item.high_temp}°</span>
                                        <span className="opacity-70 ml-1">/ {item.low_temp}°</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}