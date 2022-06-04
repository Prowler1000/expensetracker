import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Navbar from '../components/navbar'
import Page from '../components/page'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar></Navbar>
      <Page>
        <Component {...pageProps} />
      </Page>
    </>
  )
}

export default MyApp
