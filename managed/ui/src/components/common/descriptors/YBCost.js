// Copyright (c) YugaByte, Inc.

import React, { Component, PropTypes } from 'react';
import moment from 'moment';
import { YBFormattedNumber } from '../descriptors';

import './stylesheets/YBCost.css'

export default class YBCost extends Component {
  static propTypes = {
    multiplier: PropTypes.oneOf(['day', 'month', 'hour']).isRequired
  }

  render() {
    const {value, multiplier} = this.props;
    var finalCost = value;
    if (multiplier === "day") {
      finalCost = value * 24;
    }
    else if(multiplier === "month") {
      finalCost = value * 24 * moment().daysInMonth();
    }
    return (
      <div>
        <YBFormattedNumber value={finalCost} maximumFractionDigits={2}
          formattedNumberStyle="currency" currency="USD" multiplier={multiplier}/>
        <span className="config-price-subscript">{`/${multiplier}`}</span>
      </div>
    )
  }
}