import defaults from 'lodash/defaults';
import {debounce} from 'lodash';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onRunQueryDebounce = debounce(this.props.onRunQuery, 1000);

  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;

    onChange({ ...query, queryText: event.target.value });
    // Ejecutamos la query. Se espera 1s (debounce) por si se hacen más cambios, para evitar
    // ejecutar muchas una query a medio construir.
    this.onRunQueryDebounce();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryText } = query;

    return (
      <div className="gf-form">
        <FormField
          labelWidth={8}
          inputWidth={30}
          value={queryText || ''}
          onChange={this.onQueryTextChange}
          label="Gremlin query"
        />
      </div>
    );
  }
}
