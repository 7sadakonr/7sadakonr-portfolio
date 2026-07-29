import Footer from '../Footer/Footer'
import Scales from '../Scales/Scales'

const PageEnd = () => (
  <>
    <div className="contact-footer-scale" aria-hidden="true">
      <Scales
        orientation="diagonal"
        size={10}
        color="rgba(255, 255, 255, 0.1)"
      />
    </div>
    <Footer />
  </>
)

export default PageEnd
