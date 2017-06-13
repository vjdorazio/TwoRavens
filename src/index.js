import '../bootstrap/css/bootstrap-theme.min.css';
import '../app.css';
import '../Ladda/dist/ladda-themeless.min.css';

import m from 'mithril';

import * as app from './app.js';

function panelbar(id) {
    return m(
        `#${id}.panelbar`,
        m("span", [
            m.trust("&#9679;"),
            m("br"),
            m.trust("&#9679;"),
            m("br"),
            m.trust("&#9679;"),
            m("br"),
            m.trust("&#9679;")
        ])
    );
}

function leftpanel() {
    return m('#leftpanel.sidepanel.container.clearfix', [
        panelbar('toggleLpanelicon'),
        m('#leftpaneltitle.panel-heading.text-center',
          m("h3.panel-title", "Data Selection")
        ),
        m(".btn-toolbar[role=toolbar]", {
            style: {
                "margin-left": ".5em",
                "margin-top": ".5em"
            }
        }, [
            m(".btn-group", {
                style: {"margin-left": "0"}
            }, [
                m("button#btnVariables.btn.active[type=button]", {
                    title: 'Click variable name to add or remove the variable pebble from the modeling space.',
                    onclick: v => app.tabLeft('tab1')
                }, "Variables"),
                m("button#btnSubset.btn.btn-default[type=button]", {
                    onclick: v => app.tabLeft('tab2')
                }, "Subset")
            ]),
            m("button#btnSelect.btn.btn-default.ladda-button[data-spinner-color=#000000][data-style=zoom-in][type=button]", {
                title: 'Subset data by the intersection of all selected values.',
                onclick: v => app.subsetSelect('btnSelect'),
                style: {
                    display: "none",
                    float: "right",
                    "margin-right": "10px"
                }
            }, m("span.ladda-label", {
                style: {"pointer-events": "none"}
            }, "Select"))
        ]),
        m(".row-fluid",
            m('#leftpanelcontent',
                m('#leftContentArea', {
                    style: {
                        overflow: "scroll",
                        height: "488px"
                    }
                }, [
                    m('#tab1', {
                        style: {
                            display: "block",
                            padding: "6px 12px",
                            "text-align": "center"
                        }
                    }),
                    m('#tab2', {
                        style: {
                            display: "none",
                            "margin-top": ".5em"
                        }
                    }),
                    m('#tab3',
                        m("p", {
                            style: {padding: ".5em 1em"}
                        }, "Select a variable from within the visualization in the center panel to view its summary statistics.")
                    )
                ])
            )
        )
    ]);
}

function rightpanel() {
    return m('#rightpanel.sidepanel.container.clearfix', [
        panelbar('toggleRpanelicon'),
        m('#rightpaneltitle.panel-heading.text-center',
          m("h3.panel-title", "Model Selection")
        ),
        m(".btn-group.btn-group-justified[aria-label=...][role=group]", {
            style: {"margin-top": ".5em"}
        }, [
            m('button#btnModels.btn.active[type=button]', {
                onclick: v => app.tabRight('btnModels'),
                style: {width: "33%"}
            }, "Models"),
            m('button#btnSetx.btn.btn-default[type=button]', {
                onclick: v => app.tabRight('btnSetx'),
                style: {width: "34%"}
            }, "Set Covar."),
            m('button#btnResults.btn.btn-default[type=button]', {
                onclick: v => app.tabRight('btnResults'),
                style: {width: "33%"}
            }, "Results")
        ]),
        m(".row-fluid",
            m('#rightpanelcontent',
                m('#rightContentArea', {
                    style: {
                        overflow: "scroll",
                        height: "488px"
                    }
                }, [
                    m('#results', {
                        style: {"margin-top": ".5em"}
                    }, [
                        m("#resultsView.container", {
                            style: {
                                width: "80%",
                                "background-color": "white",
                                display: "none",
                                float: "right",
                                overflow: "auto",
                                "white-space": "nowrap"
                            }
                        }),
                        m('#modelView', {
                            style: {
                                width: "20%",
                                "background-color": "white",
                                display: "none",
                                float: "left"
                            }
                        }),
                        m("p#resultsHolder", {
                            style: {padding: ".5em 1em"}
                        })
                    ]),
                    m('#setx', {
                        style: {display: "none"}
                    }),
                    m('#models', {
                        style: {
                            display: "block",
                            padding: "6px 12px",
                            "text-align": "center"
                        }
                    })
                ])
            )
        )
    ]);
}

function button(id, label) {
    return m(`#${id}.clearfix.hide`, [
        m(".rectColor",
          m("svg", {
              style: {
                  width: "20px",
                  height: "20px"
              }
          }, m("circle[cx=10][cy=10][fill=white][r=9][stroke=black][stroke-width=2]"))
         ),
        m(".rectLabel", label)
    ]);
}

function panel(id, title, target, body=[]) {
    return m(`#${id}.panel.panel-default`, {
        style: {display: "none"}
    }, [
        m(".panel-heading",
          m("h3.panel-title", [
              title,
              m(`span.glyphicon.glyphicon-large.glyphicon-chevron-down.pull-right[data-target=#${target}][data-toggle=collapse][href=#${target}]`, {
                  onclick: function() {
                      $(this)
                          .toggleClass('glyphicon-chevron-up')
                          .toggleClass('glyphicon-chevron-down');
                  },
                  style: {
                      cursor: "pointer",
                      cursor: "hand"
                  }
              })
          ])
         ),
        m(`#${target}.panel-collapse.collapse.in`,
          m(".panel-body", body)
        )
    ]);
}

let Model = {
    about: false,
    cite: false
}

class Body {
    oncreate() {
        $('#leftpanel span').click(() => {
            if (!$('#leftpanel').hasClass('forceclosepanel')) {
                $('#leftpanel').removeClass('expandpanel');
                $('#leftpanel > div.row-fluid').toggleClass('closepanel');
                $('#leftpanel').toggleClass('closepanel');
                $('#main').toggleClass('svg-leftpanel');
                $('#btnSelect').css('display', 'none');
            }
        });
        $('#rightpanel span').click(() => {
            if (!$('#leftpanel').hasClass('forceclosepanel')) {
                $('#rightpanel').removeClass('expandpanel');
                $('#rightpanel > div.row-fluid').toggleClass('closepanel');
                $('#rightpanel').toggleClass('closepanel');
                $('#main').toggleClass('svg-rightpanel');
            }
        });

        let substr = (key, offset) => {
            let url = window.location.toString();
            key = key + '=';
            return url.indexOf(key) > 0 ? url.substring(url.indexOf(key) + offset) : '';
        };
        let extract = (name, val) => {
            let idx = val.indexOf('&');
            val = idx > 0 ? val.substring(0, idx) : val;
            console.log(name + ': ' + val);
            return val;
        };
        let fileid = extract('fileid', substr('dfId', 5));
        let hostname = extract('hostname', substr('host', 5));
        let apikey = extract('apikey', substr('key', 4));
        let ddiurl = extract('ddiurl', substr('ddiurl', 7)
            .replace(/%25/g, "%")
            .replace(/%3A/g, ":")
            .replace(/%2F/g, "/")
                            );
        let dataurl = extract('dataurl', substr('dataurl', 8)
            .replace(/%25/g, "%")
            .replace(/%3A/g, ":")
            .replace(/%2F/g, "/")
        );

        app.main(fileid, hostname, ddiurl, dataurl);
    }

    view() {
        return m('main',
            m("nav#option.navbar.navbar-default[role=navigation]",
                m("div", [
                    m("#navbarheader.navbar-header", [
                        m("img[alt=TwoRavens][src=images/TwoRavens.png][width=100]", {
                            onmouseover: v => Model.about = true,
                            onmouseout: v => Model.about = false,
                            style: {
                                "margin-left": "2em",
                                "margin-top": "-0.5em"
                            }
                        }),
                        m('#about.panel.panel-default', {
                            style: {
                                position: "absolute",
                                left: "140px",
                                width: "380px",
                                display: Model.about ? 'block' : 'none',
                                "z-index": "50"
                            }
                        }, m('.panel-body',
                             'TwoRavens v0.1 "Dallas" -- The Norse god Odin had two talking ravens as advisors, who would fly out into the world and report back all they observed. In the Norse, their names were "Thought" and "Memory". In our coming release, our thought-raven automatically advises on statistical model selection, while our memory-raven accumulates previous statistical models from Dataverse, to provide cummulative guidance and meta-analysis.'
                        ))
                    ]),
                    m('#dataField.field', {
                        style: {
                            "text-align": "center",
                            "margin-top": "0.5em"
                        }
                    }, [
                        m('h4#dataName', {
                            onclick: v => citetoggle = app.clickcite(citetoggle),
                            onmouseout: v => app.closecite(citetoggle),
                            onmouseover: app.opencite,
                            style: {display: "inline"}
                        }, "Dataset Name"),
                        m("#cite.panel.panel-default", {
                            style: {
                                position: "absolute",
                                right: "50%",
                                width: "380px",
                                display: "none",
                                "z-index": "50",
                                "text-align": "left"
                            }
                        }, m(".panel-body")),
                        m("button#btnEstimate.btn.btn-default.ladda-button.navbar-right[data-spinner-color=#000000][data-style=zoom-in]", {
                            onclick: v => app.estimate('btnEstimate'),
                            style: {
                                "margin-left": "2em",
                                "margin-right": "1em"
                            }
                        }, m("span.ladda-label", "Estimate")),
                        m("button#btnReset.btn.btn-default.navbar-right[title=Reset]", {
                            onclick: app.reset,
                            style: {"margin-left": "2.0em"}
                        }, m("span.glyphicon.glyphicon-repeat", {
                            style: {
                                color: "#818181",
                                "font-size": "1em",
                                "pointer-events": "none"
                            }
                        })),
                        m('#transformations.transformTool', {
                            title: 'Construct transformations of existing variables using valid R syntax. For example, assuming a variable named d, you can enter "log(d)" or "d^2".'
                        })
                    ])
                ])
            ),
            m("#main.left.svg-leftpanel.svg-rightpanel.carousel.slide", [
                m(".carousel-inner"),
                m("#spacetools.spaceTool", {
                    style: {"z-index": "16"}
                }, [
                    m("button#btnForce.btn.btn-default[title=Pin the variable pebbles to the page.]", {
                        onclick: app.forceSwitch
                    }, m("span.glyphicon.glyphicon-pushpin")),
                    m("button#btnEraser.btn.btn-default[title=Wipe all variables from the modeling space.]", {
                        onclick: app.erase
                    }, m("span.glyphicon.glyphicon-magnet"))
                ]),
                panel("legend.legendary", "Legend  ", "collapseLegend", [
                    button('timeButton', 'Time'),
                    button('csButton', 'Cross Sec'),
                    button('dvButton', 'Dep Var'),
                    button('nomButton', 'Nom Var')
                ]),
                panel("logdiv.logbox", "History ", 'collapseLog'),
                m('#ticker', {
                    style: {
                        position: "fixed",
                        height: "50px",
                        width: "100%",
                        background: "#F9F9F9",
                        bottom: "0"
                    }
                }, m("a#logID[href=somelink][target=_blank]", "Replication")),
                leftpanel(),
                rightpanel()
            ])
        );
    }
}

m.mount(document.body, Body);
