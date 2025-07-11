import React from 'react';
import PropTypes from 'prop-types';
import { faClipboard, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { AwesomeIcon } from '../AwesomeIcon';
import PropertyRow from './PropertyRow';
import Collapsible from '../Collapsible';
import copy from 'clipboard-copy';
import { getComponentClipboardRepresentation } from '../../lib/entity';
import { shouldShowProperty } from '../../lib/utils';
import Events from '../../lib/Events';

const isSingleProperty = AFRAME.schema.isSingleProperty;

/**
 * Single component.
 */
export default class Component extends React.Component {
  static propTypes = {
    component: PropTypes.any,
    entity: PropTypes.object,
    isCollapsed: PropTypes.bool,
    name: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      entity: this.props.entity,
      name: this.props.name
    };
  }

  onEntityUpdate = (detail) => {
    if (detail.entity !== this.props.entity) {
      return;
    }
    if (detail.component === this.props.name) {
      this.forceUpdate();
    }
  };

  componentDidMount() {
    Events.on('entityupdate', this.onEntityUpdate);
  }

  componentWillUnmount() {
    Events.off('entityupdate', this.onEntityUpdate);
  }

  static getDerivedStateFromProps(props, state) {
    if (state.entity !== props.entity) {
      return { entity: props.entity };
    }
    if (state.name !== props.name) {
      return { name: props.name };
    }
    return null;
  }

  removeComponent = (event) => {
    var componentName = this.props.name;
    event.stopPropagation();
    if (
      confirm('Do you really want to remove component `' + componentName + '`?')
    ) {
      this.props.entity.removeAttribute(componentName);
      Events.emit('componentremove', {
        entity: this.props.entity,
        component: componentName
      });
    }
  };

  /**
   * Render propert(ies) of the component.
   */
  renderPropertyRows = () => {
    const componentData = this.props.component;

    if (isSingleProperty(componentData.schema)) {
      const componentName = this.props.name;
      const schema = AFRAME.components[componentName.split('__')[0]].schema;
      return (
        <PropertyRow
          key={componentName}
          name={componentName}
          schema={schema}
          data={componentData.data}
          componentname={componentName}
          isSingle={true}
          entity={this.props.entity}
        />
      );
    }

    return Object.keys(componentData.schema)
      .sort()
      .filter((propertyName) => shouldShowProperty(propertyName, componentData))
      .map((propertyName) => (
        <PropertyRow
          key={propertyName}
          name={propertyName}
          schema={componentData.schema[propertyName]}
          data={componentData.data[propertyName]}
          componentname={this.props.name}
          isSingle={false}
          entity={this.props.entity}
        />
      ));
  };

  render() {
    const componentName = this.props.name;

    return (
      <Collapsible collapsed={this.props.isCollapsed}>
        <div className="componentHeader collapsible-header">
          <span className="componentTitle" title={componentName}>
            <span>{componentName}</span>
          </span>
          <div className="componentHeaderActions">
            <a
              title="Copy to clipboard"
              className="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                copy(
                  getComponentClipboardRepresentation(
                    this.state.entity,
                    componentName.toLowerCase()
                  )
                );
              }}
            >
              <AwesomeIcon icon={faClipboard} />
            </a>
            <a
              title="Remove component"
              className="button"
              onClick={this.removeComponent}
            >
              <AwesomeIcon icon={faTrashAlt} />
            </a>
          </div>
        </div>
        <div className="collapsible-content">{this.renderPropertyRows()}</div>
      </Collapsible>
    );
  }
}
