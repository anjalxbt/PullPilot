/**
 * ⚠️ SAMPLE FILE - Contains intentional issues for auto-fix testing
 * 
 * PullPilot should detect and suggest fixes for:
 * - console.log statements
 * - unused imports
 * - trailing whitespace
 */

// Unused imports - should be flagged for removal
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import lodash from 'lodash';
import moment from 'moment';

// Only useState is actually used
export function UserProfile() {
  const [name, setName] = useState('');

  // console.log - should be flagged for removal
  console.log('Component rendered');
  console.log('Current name:', name);
  console.debug('Debug info:', { name });
  console.info('Info:', name);

  function handleSubmit() {
    console.log('Form submitted with name:', name);
    // actual logic here...
    setName('');
  }

  return { name, handleSubmit };
}

// More console.log patterns
export function processData(data: any[]) {
  console.log('Processing data:', data.length, 'items');
  
  const result = data.filter(item => {
    console.log('Checking item:', item);
    return item.active;
  });

  console.log('Filtered result:', result);
  return result;
}

// Trailing whitespace examples (there are intentional trailing spaces below)    
export function calculateTotal(items: number[]): number {    
  let total = 0;    
  for (const item of items) {    
    total += item;    
  }    
  return total;    
}    
