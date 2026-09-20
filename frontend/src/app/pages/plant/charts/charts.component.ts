import { Component, Input, ChangeDetectorRef, OnChanges, SimpleChanges, OnDestroy, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { AnimateOnScrollDirective } from '../../../shared/directives/animate-on-scroll.directive';
import { ModalComponent } from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule, FormsModule, AnimateOnScrollDirective, ModalComponent],
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() plantId: string = '';
  @Input() plant: any = { name: 'Caricamento...' };
  @Input() currentUserRole: string = 'Membro';
  lastSyncTime = 'In attesa di dati...';
  isDataLoading = true;
  hasDataInPeriod = true;

  isSensorModalOpen = false;
  currentSensorId = '';
  newSensorId = '';

  allData: any[] = [];
  startDate: string = '';
  endDate: string = '';
  datePreset: string = '7days';
  maxAllowedDate: string = '';
  
  tempUnit: string = '°C';

  private fetchAbortController?: AbortController;
  private activeChartIds: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadUserSettings();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['plantId'] && changes['plantId'].currentValue) {
        const oggi = new Date();
        this.maxAllowedDate = oggi.toISOString().split('T')[0];

        this.applyPreset('7days', false);
        this.fetchRealMeasurements();
    }
  }

  applyPreset(preset: string, triggerFilter: boolean = true) {
      this.datePreset = preset;
      const oggi = new Date();
      this.endDate = oggi.toISOString().split('T')[0];

      if (preset === 'today') {
          this.startDate = this.endDate;
      } else if (preset === '7days') {
          const setteGiorniFa = new Date();
          setteGiorniFa.setDate(oggi.getDate() - 7);
          this.startDate = setteGiorniFa.toISOString().split('T')[0];
      } else if (preset === '30days') {
          const trentaGiorniFa = new Date();
          trentaGiorniFa.setDate(oggi.getDate() - 30);
          this.startDate = trentaGiorniFa.toISOString().split('T')[0];
      }

      if (preset !== 'custom' && triggerFilter && this.allData.length > 0) {
          this.applyDateFilter();
      }
  }
  
  async loadUserSettings() {
    const userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email');
    if (!userEmail) return;

    try {
      const res = await fetch(`${environment.apiUrl}/settings/${userEmail}`);
      if (res.ok) {
        const profile = await res.json();
        
        this.tempUnit = profile.prefs?.tempUnit || 'C'; 
        
        if (this.allData.length > 0) {
            this.applyDateFilter();
        }
      }
    } catch (error) {
      console.error("Failed to load user settings for charts", error);
    }
  }

  async fetchRealMeasurements() {
      this.isDataLoading = true;
      this.cdr.detectChanges();

      if (this.fetchAbortController) {
          this.fetchAbortController.abort();
      }
      this.fetchAbortController = new AbortController();

      try {
          const res = await fetch(`${environment.apiUrl}/plants/${this.plantId}/misurazioni`, {
              signal: this.fetchAbortController.signal
          });
          if (res.ok) {
              this.allData = await res.json();
              this.applyDateFilter();
          }
      } catch (error: any) {
          if (error.name === 'AbortError') return; 
          console.error("Errore fetch misurazioni:", error);
          this.lastSyncTime = "Errore di connessione";
          this.isDataLoading = false;
          this.cdr.detectChanges();
      }
  }

  applyDateFilter() {
      let filteredData = this.allData;

      if (this.startDate && this.endDate) {
          const start = new Date(this.startDate).getTime();
          const end = new Date(this.endDate).setHours(23, 59, 59, 999);

          filteredData = this.allData.filter((m: any) => {
              const mTime = new Date(m.data).getTime();
              return mTime >= start && mTime <= end;
          });
      }

      if (filteredData.length === 0) {
          this.lastSyncTime = "Nessun dato nel periodo";
          this.hasDataInPeriod = false;
          this.isDataLoading = false;
          this.cdr.detectChanges();
          return;
      }

      this.hasDataInPeriod = true;

      const timeLabels = filteredData.map((m: any) => {
          const dateObj = new Date(m.data);
          return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')} ` +
                 `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      });

      const lastRecord = filteredData[filteredData.length - 1];
      const lastDate = new Date(lastRecord.data);
      this.lastSyncTime = `Ultimo: ${lastDate.getDate()}/${lastDate.getMonth()+1}, ${lastDate.getHours()}:${lastDate.getMinutes().toString().padStart(2, '0')}`;

      const dataUmidita = filteredData.map((m: any) => m.umidita_terreno);
      const dataUmiditaAmbiente = filteredData.map((m: any) => m.umidita_ambiente);
      const dataLuce = filteredData.map((m: any) => m.esposizione_luce);
      
      const dataTemp = filteredData.map((m: any) => {
          let temp = m.temperatura;
		  if (temp !== null && temp !== undefined && this.tempUnit === 'F') {
			  temp = (temp * 9/5) + 32;
			  return parseFloat(temp.toFixed(1)); 
		  }
          return temp;
      });

      this.isDataLoading = false;
      this.cdr.detectChanges();

      setTimeout(() => {
          const cUmidita = `chartUmidita-${this.plantId}`;
          const cUmiditaAmb = `chartUmiditaAmbiente-${this.plantId}`;
          const cTemp = `chartTemp-${this.plantId}`;
          const cLuce = `chartLuce-${this.plantId}`;

          this.activeChartIds = [cUmidita, cUmiditaAmb, cTemp, cLuce];
          
          const tempYMax = this.tempUnit === 'F' ? 125 : 50;

          this.createMiniChart(cUmidita, 'Umidità Terreno', dataUmidita, timeLabels, '#27AE60', 'rgba(39, 174, 96, 0.1)', 100);
          this.createMiniChart(cUmiditaAmb, 'Umidità Ambiente', dataUmiditaAmbiente, timeLabels, '#00BCD4', 'rgba(0, 188, 212, 0.1)', 100);
          this.createMiniChart(cTemp, `Temperatura (°${this.tempUnit})`, dataTemp, timeLabels, '#E74C3C', 'rgba(231, 76, 60, 0.1)', tempYMax);
          this.createMiniChart(cLuce, 'Luce Solare', dataLuce, timeLabels, '#F5A623', 'rgba(245, 166, 35, 0.15)', 150000);
      }, 0);
  }

  createMiniChart(canvasId: string, label: string, data: number[], labels: string[], color: string, bgColor: string, yMax: number) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const existingChart = Chart.getChart(canvasId);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label, data: data, borderColor: color, backgroundColor: bgColor,
          borderWidth: 2, pointRadius: 2, pointHoverRadius: 6, fill: true, tension: 0.4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#2c3e50', bodyColor: '#2c3e50', borderColor: '#eee', borderWidth: 1, displayColors: false, padding: 10 } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#95a5a6' } }, y: { min: 0, max: yMax, grid: { color: '#f0f0f0' }, ticks: { font: { size: 10 }, color: '#95a5a6' } } },
        interaction: { mode: 'index', intersect: false }
      }
    });
  }

  async openSensorModal() {
    try {
        const res = await fetch(`${environment.apiUrl}/plants/${this.plantId}`);
        if (res.ok) {
            const plant = await res.json();
            this.currentSensorId = plant.hardwareSensorId || '';
        }
    } catch (error) {}
    this.isSensorModalOpen = true;
  }

  closeSensorModal() {
    this.isSensorModalOpen = false;
    this.newSensorId = '';
  }

  async linkSensorToPlant(hardwareId: string) {
    try {
      const res = await fetch(`${environment.apiUrl}/plants/${this.plantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hardwareSensorId: hardwareId })
      });

      if (res.ok) {
        this.currentSensorId = hardwareId;
        this.newSensorId = '';
      }
    } catch (error) {}
  }

  exportToPDF() { window.print(); }

  ngOnDestroy() {
    if (this.fetchAbortController) {
        this.fetchAbortController.abort();
    }
    this.activeChartIds.forEach(id => {
        const chart = Chart.getChart(id);
        if (chart) chart.destroy();
    });
  }
}