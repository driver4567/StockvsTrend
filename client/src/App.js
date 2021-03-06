import React, { Component } from 'react';
import Graph from './components/graph';
import Form from './components/form';

import 'bootstrap/dist/css/bootstrap.css';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { 
      tickerSymbol: 'WATT',
      selectedTicker: null,
      stockData: null,

      stockIsInvalid: false,
      trendIsInvalid: false,

      trendsData: null,
      selectedTrend: null,
      trendSearchTerm: 'Energous',
      dateRange: '2 Years',

      dateRangeError: '',
      stockApiError: '',
      trendApiError: ''
    };

    this.resetFormFields = this.resetFormFields.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.getStockData = this.getStockData.bind(this);
    this.handleOnSubmit = this.handleOnSubmit.bind(this);
    this.updateGraphsWithState = this.updateGraphsWithState.bind(this);
  }

  componentDidMount() {
    // Runs as soon as App is mounted to dom
    // and gets stock data.

    this.updateGraphsWithState();
  }

  updateGraphsWithState() {
    this.getStockData(this.state.tickerSymbol, this.state.dateRange);
    this.getTrendData(this.state.trendSearchTerm, this.state.dateRange);
  }

  resetFormFields() {
    this.setState({
        tickerSymbol: 'WATT',
        trendSearchTerm: 'Energous',
        dateRange: '2 Years'
    });
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;

    let value = target.type === 'checkbox' ? target.checked : target.value;

    if (name === 'tickerSymbol') {
      value = value.toLocaleUpperCase();
    }

    this.setState({
      [name]: value
    });
  }

  handleOnSubmit(event) {
    event.preventDefault();

    // Check if date range is selected
    if(this.state.dateRange === 'Select a date range') {
      this.setState({
        dateRangeError: true
      });

      return;
    } 

    this.setState({
      dateRangeError: false
    });

    this.updateGraphsWithState();
  }

  async fetchData(apiEndpoint, apiParams) {

    let urlParms = '';
    Object.keys(apiParams).forEach(key => {
      urlParms += `${key}=${apiParams[key]}&`
    });

    const response = await fetch(
      `/api/${apiEndpoint}?${urlParms}`
    );

    let body;
    if (response.status !== 200) {
      const errorMsg = 'Unable to connect to API server.';
      this.setState({
        stockApiError: errorMsg,
        trendApiError: errorMsg
      });
      body = null;
    } else {
      body = await response.json();
    }
    
    return body;
  }

  async getTrendData(trendSearchTerm, dateRange) {
    // Magic from 
    // https://tinyurl.com/nodewithreact

    // Trim whitespace from both sides of search term
    const searchTerm = trendSearchTerm.trim();

    // Auto-magically set trendInvalid to false
    this.setState({
      trendIsInvalid: false,
      trendApiError: ''
    });
  
    // Checks if entered term isn't empty
    if (searchTerm.length < 1) {
      this.setState({
        trendIsInvalid: true,
        trendsData: null
      });

      return;
    }

    // Check if trend is already selected, then sets null (for loading effect)
    if (searchTerm !== this.state.selectedTrend) {
      this.setState({
        trendsData: null,
        selectedTrend: null
      });
    }

    // Get dat data from Google Trends!
    let trendsData = await this.fetchData('googletrends', 
      {
        dateRange,
        searchTerm
      }
    );

    // Check we actually get some data
    if(!trendsData) {
      return;
    }

    // Parse this JSON to an object
    trendsData = JSON.parse(trendsData.results);

    // Check if we got the data we expected.
    if(!trendsData.default.timelineData) {
      console.log(trendsData);
      this.setState({
        trendIsInvalid: true
      });
    }

    // Just one more extra step to get the timeline data!
    trendsData = trendsData.default.timelineData;

    // Check we get a response back with data
    if (trendsData.length < 1) {
      this.setState({
        trendIsInvalid: true,
        selectedTrend: searchTerm,
        trendsData: null
      });

      return;
    }

    // Set state of trends if all checks pass!
    this.setState({ 
      trendsData: trendsData,
      selectedTrend: searchTerm
    });
  }

  async getStockData(tickerSymbol, dateRange) {
    const stockTicker = tickerSymbol.trim();

    this.setState({
      stockIsInvalid: false,
      stockApiError: ''
    });

    // Check stock ticker entry isn't empty
    if(stockTicker < 1) {
      this.setState({
        selectedTicker: stockTicker,
        stockIsInvalid: true,
        stockData: null
      });

      return;
    }

    // If ticker isn't the same, set stockData to null (for loading effect)
    if(stockTicker !== this.state.selectedTicker) {
      this.setState({
        stockData: null,
        selectedTicker: null
      });
    }

    // Fetch stock data!
    const data = await this.fetchData('stocks', {
      tickerSymbol,
      dateRange
    });

    // Check if any data is recieved to begin with
    if(!data) {
      return;
    }

    // Check for external server error.
    if(data.error) {
      this.setState({
        stockApiError: data.error,
        selectedTicker: stockTicker,
        stockData: null
      })

      return;
    }

    // If returned array has nothing (404), create error.
    if(data.length < 1) {
      this.setState({
        selectedTicker: stockTicker,
        stockIsInvalid: true,
        stockData: null
      });

      return;
    }

    // Set stock state after all above checks.
    this.setState({
      selectedTicker: stockTicker,
      stockData: data
    });

  }

  render() {
    return (
      <div className="jumbotron vertical-center">
        <div className="container">
          <div className="row">
            <div className='col-md-4 order-1 sidebar'>
              <h1 className='text-center'><span className='stock-color'>Stock</span> vs <span className='trend-color'>Trend</span></h1>
              <p className='open-source'><a href="https://github.com/gabenunez/StockvsTrend/..">An Open Source Project</a> by <a href="https://github.com/gabenunez/">Gabe Nunez</a></p>
              <Form
                resetFormFields={this.resetFormFields}
                handleInputChange={this.handleInputChange}
                handleOnSubmit={this.handleOnSubmit}

                tickerSymbol={this.state.tickerSymbol}
                trendSearchTerm={this.state.trendSearchTerm}
                dateRange={this.state.dateRange}
                
                dateRangeError={this.state.dateRangeError}
                stockIsInvalid={this.state.stockIsInvalid}
                trendIsInvalid={this.state.trendIsInvalid}
              />

              <p className='text-center feedback'><a href="https://mailchi.mp/2b50831a14a6/gabenunez">I'm working on a new project... want in? <br /> I promise it's highly related.</a></p>
            </div>
            <div className="col-md-8 order-2 graph-container">
              <div className='row'>
                <div className='col-md-12'>
                  <h3 className='text-center stock-color graph-heading'>Stock {this.state.selectedTicker ?  `(${this.state.selectedTicker.toLocaleUpperCase()})` : ''}</h3>
                  <div className='graph-div'>
                    <Graph 
                      list={this.state.stockData} 
                      line_name='Stock'
                      line_dataKey='close'
                      line_color='#8884d8'
                      xAxis_dataKey='label'
                      stockIsInvalid={this.state.stockIsInvalid}
                      stockApiError={this.state.stockApiError}
                    />
                  </div>
                </div>
              </div>

              <div className='row'>
                <div className='col-md-12'>
                  <h3 className='text-center trend-color graph-heading'>Trend {this.state.selectedTrend || this.state.trendIsInvalid ? `(${this.state.selectedTrend})` : ''}</h3>
                  <div className='graph-div'>
                    <Graph 
                      list={this.state.trendsData}
                      line_name='Google Trend'
                      line_dataKey='value'
                      line_color='#f54336'
                      xAxis_dataKey='formattedTime'
                      trendIsInvalid={this.state.trendIsInvalid}
                      trendApiError={this.state.trendApiError}
                    />
                  </div>
                  <p className="text-center attribution">
                    <a href="https://iexcloud.io">Data provided by IEX Cloud</a>
                  </p>
                  <p className="text-center disclaimer">
                    Disclaimer: We are not liable for any losses associated with
                    the use of this tool.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
