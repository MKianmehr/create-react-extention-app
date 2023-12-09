import React from 'react';
import ReactDOM from 'react-dom';

type Props = {};

const renderComponent = (children: React.ReactNode, targetElement: Element | null) => {
    const root = document.createElement('div');
    if (targetElement) {
        targetElement.appendChild(root);
        ReactDOM.render(
            <React.StrictMode>
                {children}
            </React.StrictMode>,
            root
        );
    } else {
        console.error('Target element not found');
    }
};

const App = ()=> {
    return (
      <div>
        Content Script
      </div>
    );
  }

const targetElement = document.body
renderComponent(<App/>, targetElement)


