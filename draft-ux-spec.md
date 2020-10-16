# Client UX Spec

The following UX specifications define the expected behaviour for each condition when interacting with either the Connect or Disconnect methods of the client. In both flows, the client should be able to render the UI internally by defining a standard user flow events,

## Connect

required context params:

- environment identifier (aka connection metadata)
- persisted connections
- persisted sessions

required user params:

- application identifier (aka session metadata)

FIRST: verify if there are any connections created

if no connection is present:

- prompt user to create one

if a connection is present:

- prompt user to select existing or create a new one

once a connection is established:

- trigger connection_approved

SECOND: verify if session matches application

if no sessions exists matching application:

- prompt the user to approve session on mobile

if a session exists matching application:

- proceed

once a session is established:

- trigger session_approved

FINALLY: resolve promise

## Disconnect

required context params:

- environment identifier (aka connection metadata)
- persisted connections
- persisted sessions

required user params:

- application identifier (aka session metadata)

FIRST: verify if connection and/or matching session exists

if no connection/session present

- throw error

if a connection/session present

- this.session.delete()

FINALLY: resolve promise
