import React, { Component } from 'react';
import ReactInterval from 'react-interval';
import 'whatwg-fetch';
import moment from 'moment';
import momentLocale from 'moment/locale/de';
import './App.css';

function parseMetrics(plainTextMetrics) {
  const metrics = {};

  plainTextMetrics.split('\n')
  .filter(line => line.substring(0, 1) !== '#') // Filter comments
  .forEach((line) => {
    const metricNameAndLabels = line.split(' ')[0];
    const timeSeries = {
      metricName: null,
      labels: {},
      sample: line.split(' ')[1],
    };

    if (metricNameAndLabels.indexOf('{') < 0) {
      timeSeries.metricName = metricNameAndLabels;
    } else {
      timeSeries.metricName = metricNameAndLabels.substring(0, metricNameAndLabels.indexOf('{'));
      const labelsString = metricNameAndLabels.substring(metricNameAndLabels.indexOf('{') + 1, metricNameAndLabels.indexOf('}'));
      const labels = labelsString.split(',');
      labels.forEach((labelString) => {
        const labelName = labelString.split('=')[0];
        const labelValue = labelString.split('=')[1].split('"')[1];
        timeSeries.labels[labelName] = labelValue;
      });
    }

    if (!Array.isArray(metrics[timeSeries.metricName])) {
      metrics[timeSeries.metricName] = [];
    }
    metrics[timeSeries.metricName].push(timeSeries);
  });

  return metrics;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      now: new Date(),
      lastUpdateTimestamp: 0,
    };
    this.update = this.update.bind(this);
    this.getTemperatureString = this.getTemperatureString.bind(this);
    this.getRelHumidityString = this.getRelHumidityString.bind(this);
    this.getAbsHumidityString = this.getAbsHumidityString.bind(this);
  }

  componentDidMount() {
    moment.updateLocale('de', momentLocale);
  }

  getTemperatureString(sensorId) {
    const temperatures = this.state.metrics && this.state.metrics.air_temperature;

    if (Array.isArray(temperatures)) {
      let timeSeries;
      temperatures.forEach((item) => {
        if (item.labels.sensorId === sensorId) {
          timeSeries = item;
        }
      });
      if (timeSeries) {
        return `${parseFloat(timeSeries.sample).toFixed(1)} °C`;
      }
    }

    return 'unbekannt';
  }

  getRelHumidityString(sensorId) {
    const relHumidities = this.state.metrics && this.state.metrics.humidity_relative;

    if (Array.isArray(relHumidities)) {
      let timeSeries;
      relHumidities.forEach((item) => {
        if (item.labels.sensorId === sensorId) {
          timeSeries = item;
        }
      });

      if (timeSeries) {
        return `${parseFloat(timeSeries.sample).toFixed(0)} %`;
      }
    }

    return 'unbekannt';
  }

  getAbsHumidityString(sensorId) {
    const absHumidities = this.state.metrics && this.state.metrics.humidity_absolute;

    if (Array.isArray(absHumidities)) {
      let timeSeries;
      absHumidities.forEach((item) => {
        if (item.labels.sensorId === sensorId) {
          timeSeries = item;
        }
      });

      if (timeSeries) {
        return `${parseFloat(timeSeries.sample).toFixed(1)}`;
      }
    }

    return 'unbekannt';
  }

  update() {
    const self = this;
    this.setState({ now: new Date() });

    if ((Date.now() - this.state.lastUpdateTimestamp) < 10000) {
      return;
    }

    fetch('http://maurice:3000/metrics')
    .then(response => response.text())
    .then(parseMetrics)
    .then(metrics => this.setState({
      lastUpdateTimestamp: Date.now(),
      metrics,
    }))
    .catch((ex) => {
      console.err('parsing failed', ex);
    });
  }

  render() {
    return (
      <div className="App">
        <div className="flex-container">
          <div className="wallTime group primary flex-item">
            <time dateTime={this.state.now.toISOString()}>{moment(this.state.now).format('LTS')}</time>
          </div>
        </div>
        <div className="flex-container">
          <div className="livingRoom group secondary flex-item">
            <h3>Wohnzimmer</h3>
            <p className="temperature">{ this.getTemperatureString('5') }</p>
            <p className="relHumidity">{ this.getRelHumidityString('5') }</p>
            <p className="absHumidity">{ this.getAbsHumidityString('5') } <sup>g</sup>/<sub>m&sup3;</sub></p>
          </div>
          <div className="outdoor group secondary flex-item">
            <h3>Außen</h3>
            <p className="temperature">{ this.getTemperatureString('0') }</p>
            <p className="relHumidity">{ this.getRelHumidityString('0') }</p>
            <p className="absHumidity">{ this.getAbsHumidityString('0') } <sup>g</sup>/<sub>m&sup3;</sub></p>
          </div>
        </div>
        <div className="flex-container">
          <div className="office group tertiary flex-item">
            <h3>Büro</h3>
            <p className="temperature">{ this.getTemperatureString('4') }</p>
            <p className="relHumidity">{ this.getRelHumidityString('4') }</p>
            <p className="absHumidity">{ this.getAbsHumidityString('4') } <sup>g</sup>/<sub>m&sup3;</sub></p>
          </div>
          <div className="supplyRoom group tertiary flex-item">
            <h3>Vorratsraum</h3>
            <p className="temperature">{ this.getTemperatureString('3') }</p>
            <p className="relHumidity">{ this.getRelHumidityString('3') }</p>
            <p className="absHumidity">{ this.getAbsHumidityString('3') } <sup>g</sup>/<sub>m&sup3;</sub></p>
          </div>
          <div className="bedRoom group tertiary flex-item">
            <h3>Schlafzimmer</h3>
            <p className="temperature">{ this.getTemperatureString('2') }</p>
            <p className="relHumidity">{ this.getRelHumidityString('2') }</p>
            <p className="absHumidity">{ this.getAbsHumidityString('2') } <sup>g</sup>/<sub>m&sup3;</sub></p>
          </div>
        </div>
        <ReactInterval enabled callback={this.update} />
      </div>
    );
  }
}

export default App;
